import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { authMiddleware, JWT_SECRET, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are both required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      res.status(401).json({ success: false, message: 'No account found with this email.' });
      return;
    }

    // bcrypt compare handles the hashing — we never store plain text
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      res.status(401).json({ success: false, message: 'Incorrect password. Try again.' });
      return;
    }

    // token lasts 7 days so users don't get logged out constantly
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, age: user.age, gender: user.gender, credits: user.credits, onboardingComplete: user.onboardingComplete ?? false },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong on our end.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, email, password, age, gender, city, height, religion, profession, college,
      about, tags, weekendVibe, firstDateIdea, loveLanguage, photo,
    } = req.body as {
      name: string; email: string; password: string; age: number; gender: string;
      city?: string; height?: string; religion?: string; profession?: string; college?: string;
      about?: string; tags?: string[]; weekendVibe?: string; firstDateIdea?: string; loveLanguage?: string; photo?: string;
    };

    if (!name || !email || !password || !age || !gender) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      return;
    }

    // check if email is taken before trying to insert
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      _id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      age: Number(age),
      gender,
      city: city?.trim() || undefined,
      height: height?.trim() || undefined,
      religion: religion?.trim() || undefined,
      profession: profession?.trim() || undefined,
      college: college?.trim() || undefined,
      about: about?.trim() || undefined,
      tags: Array.isArray(tags) ? tags.filter(Boolean) : undefined,
      weekendVibe: weekendVibe?.trim() || undefined,
      firstDateIdea: firstDateIdea?.trim() || undefined,
      loveLanguage: loveLanguage?.trim() || undefined,
      photo: photo?.trim() || undefined,
      credits: 2, // every new user gets 2 free credits to start
    });

    // also create a matchable profile so other users can find this person
    await Profile.findOneAndUpdate(
      { _id: newUser._id },
      {
        $setOnInsert: {
          _id: newUser._id,
          name: newUser.name,
          age: Number(age),
          gender,
          city: city?.trim() || 'Mumbai',
          height: height?.trim() || "5'7\"",
          religion: religion?.trim() || 'Any',
          profession: profession?.trim() || 'Working Professional',
          college: college?.trim() || undefined,
          distance: '5 km',
          about: about?.trim() || `Hi, I'm ${newUser.name}. Looking for meaningful connections.`,
          tags: Array.isArray(tags) && tags.length > 0 ? tags : ['New here'],
          weekendVibe: weekendVibe?.trim() || 'Exploring the city',
          firstDateIdea: firstDateIdea?.trim() || 'Coffee and conversation',
          loveLanguage: loveLanguage?.trim() || 'Quality Time',
          verified: true,
          photo: photo?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=710014&color=fff&size=400`,
        },
      },
      { upsert: true, new: true },
    );

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        age: newUser.age,
        gender: newUser.gender,
        credits: newUser.credits,
        city: newUser.city,
        height: newUser.height,
        religion: newUser.religion,
        profession: newUser.profession,
        college: newUser.college,
        about: newUser.about,
        tags: newUser.tags,
        weekendVibe: newUser.weekendVibe,
        firstDateIdea: newUser.firstDateIdea,
        loveLanguage: newUser.loveLanguage,
        photo: newUser.photo,
        onboardingComplete: newUser.onboardingComplete ?? false,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong on our end.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;

    // always hit mongo fresh so credits are never stale from the jwt payload
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        credits: user.credits,
        city: user.city,
        height: user.height,
        religion: user.religion,
        profession: user.profession,
        college: user.college,
        about: user.about,
        tags: user.tags,
        weekendVibe: user.weekendVibe,
        firstDateIdea: user.firstDateIdea,
        loveLanguage: user.loveLanguage,
        photo: user.photo,
        onboardingComplete: user.onboardingComplete ?? false,
      },
    });
  } catch (err) {
    console.error('/me error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

// PUT /api/auth/profile — saves onboarding data and marks it complete
router.put('/profile', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const {
      name, age, gender, city, height, religion, profession, college,
      about, tags, weekendVibe, firstDateIdea, loveLanguage, photo,
    } = req.body as {
      name?: string; age?: number; gender?: string; city?: string; height?: string;
      religion?: string; profession?: string; college?: string; about?: string;
      tags?: string[]; weekendVibe?: string; firstDateIdea?: string; loveLanguage?: string; photo?: string;
    };

    const cleanTags = Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : undefined;

    // only overwrite fields that were actually provided in the request
    const userUpdate: Record<string, unknown> = { onboardingComplete: true };
    const set = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== '') userUpdate[k] = v; };
    set('name', name?.trim());
    set('age', age != null ? Number(age) : undefined);
    set('gender', gender);
    set('city', city?.trim());
    set('height', height?.trim());
    set('religion', religion?.trim());
    set('profession', profession?.trim());
    set('college', college?.trim());
    set('about', about?.trim());
    set('weekendVibe', weekendVibe?.trim());
    set('firstDateIdea', firstDateIdea?.trim());
    set('loveLanguage', loveLanguage?.trim());
    set('photo', photo?.trim());
    if (cleanTags) userUpdate.tags = cleanTags;

    const user = await User.findByIdAndUpdate(userId, { $set: userUpdate }, { new: true }).select('-passwordHash');
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    // mirror the same data onto the Profile so this user shows up in searches
    const profileUpdate: Record<string, unknown> = {};
    const setP = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== '') profileUpdate[k] = v; };
    setP('name', name?.trim());
    setP('age', age != null ? Number(age) : undefined);
    setP('gender', gender);
    setP('city', city?.trim());
    setP('height', height?.trim());
    setP('religion', religion?.trim());
    setP('profession', profession?.trim());
    setP('college', college?.trim());
    setP('about', about?.trim());
    setP('weekendVibe', weekendVibe?.trim());
    setP('firstDateIdea', firstDateIdea?.trim());
    setP('loveLanguage', loveLanguage?.trim());
    setP('photo', photo?.trim());
    if (cleanTags && cleanTags.length > 0) profileUpdate.tags = cleanTags;

    await Profile.findByIdAndUpdate(userId, { $set: profileUpdate });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        credits: user.credits,
        city: user.city,
        height: user.height,
        religion: user.religion,
        profession: user.profession,
        college: user.college,
        about: user.about,
        tags: user.tags,
        weekendVibe: user.weekendVibe,
        firstDateIdea: user.firstDateIdea,
        loveLanguage: user.loveLanguage,
        photo: user.photo,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (err) {
    console.error('Save profile error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

export default router;
