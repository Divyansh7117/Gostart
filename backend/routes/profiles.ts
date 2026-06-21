import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Profile } from '../models/Profile';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/profiles — list all profiles, optionally filtered by gender or age range
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { gender, minAge, maxAge } = req.query as { gender?: string; minAge?: string; maxAge?: string };

    const query: Record<string, unknown> = {};
    if (gender) query.gender = gender;
    if (minAge || maxAge) query.age = { ...(minAge ? { $gte: Number(minAge) } : {}), ...(maxAge ? { $lte: Number(maxAge) } : {}) };

    const profiles = await Profile.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: profiles.length, profiles });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

// GET /api/profiles/:id — fetch a single profile by id
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) { res.status(404).json({ success: false, message: 'Profile not found.' }); return; }
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

// POST /api/profiles — add a new profile to the dating pool without touching seed data
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, age, gender, city, height, religion, profession, college,
      distance, about, tags, weekendVibe, firstDateIdea, loveLanguage,
      verified, photo,
    } = req.body;

    // check all required fields upfront so the error message is actually helpful
    const requiredFields = { name, age, gender, city, height, religion, profession, distance, about, weekendVibe, firstDateIdea, loveLanguage, photo };
    const missing = Object.entries(requiredFields).filter(([, v]) => !v && v !== 0).map(([k]) => k);
    if (missing.length > 0) {
      res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
      return;
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      res.status(400).json({ success: false, message: 'tags must be a non-empty array of strings.' });
      return;
    }

    const profile = await Profile.create({
      _id: uuidv4(),
      name, age: Number(age), gender, city, height, religion, profession,
      college: college ?? undefined,
      distance, about, tags, weekendVibe, firstDateIdea, loveLanguage,
      verified: verified ?? false,
      photo,
    });

    res.status(201).json({ success: true, message: 'Profile created!', profile });
  } catch (err) {
    console.error('Create profile error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

export default router;
