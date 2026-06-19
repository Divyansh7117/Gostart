// ====================================================================
// Auth Routes — Register, Login, /me
//
// HOW IT WORKS:
//   POST /register  → hashes the password with bcrypt (10 rounds),
//                     stores the user in MongoDB, returns a JWT.
//   POST /login     → finds the user by email, compares bcrypt hash,
//                     returns a signed JWT valid for 7 days.
//   GET  /me        → verifies the JWT, reads the user from MongoDB
//                     (always fresh — so credits are never stale).
//
// WHY JWT? Self-contained tokens — no server-side sessions to store.
// Every protected request just verifies the signature.
// ====================================================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
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

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      res.status(401).json({ success: false, message: 'Incorrect password. Try again.' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, age: user.age, gender: user.gender, credits: user.credits },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong on our end.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, age, gender } = req.body as {
      name: string; email: string; password: string; age: number; gender: string;
    };

    if (!name || !email || !password || !age || !gender) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

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
      credits: 2, // every new user gets 2 free credits
    });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, age: newUser.age, gender: newUser.gender, credits: newUser.credits },
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

    // Always read from MongoDB so credits are live, not stale from the JWT payload
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, age: user.age, gender: user.gender, credits: user.credits },
    });
  } catch (err) {
    console.error('/me error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

export default router;
