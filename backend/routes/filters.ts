import { Router, Request, Response } from 'express';
import { UserFilter } from '../models/UserFilter';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { SearchFilters } from '../types';

const router = Router();

// sensible defaults so new users get reasonable results on first search
const DEFAULT_FILTERS: SearchFilters = {
  lookingFor: 'Women',
  minAge: 20,
  maxAge: 35,
  location: 'Nearby',
  religion: null,
  profession: null,
};

// GET /api/filters — return saved filters or defaults if nothing saved yet
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const record = await UserFilter.findOne({ userId });

    if (!record) {
      res.json({ success: true, filters: DEFAULT_FILTERS });
      return;
    }

    res.json({
      success: true,
      filters: {
        lookingFor: record.lookingFor,
        minAge: record.minAge,
        maxAge: record.maxAge,
        location: record.location,
        religion: record.religion,
        profession: record.profession,
      } as SearchFilters,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

// POST /api/filters — upsert so first save creates it and every later save updates in place
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lookingFor, minAge, maxAge, location, religion, profession } =
      req.body as Partial<SearchFilters>;
    const { userId } = (req as AuthenticatedRequest).user;

    if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
      res.status(400).json({ success: false, message: 'Min age cannot be greater than max age.' });
      return;
    }

    const newFilters: SearchFilters = {
      lookingFor: lookingFor ?? DEFAULT_FILTERS.lookingFor,
      minAge: minAge ?? DEFAULT_FILTERS.minAge,
      maxAge: maxAge ?? DEFAULT_FILTERS.maxAge,
      location: location ?? DEFAULT_FILTERS.location,
      religion: religion ?? null,
      profession: profession ?? null,
    };

    // storing in mongo so filters persist across sessions
    await UserFilter.findOneAndUpdate(
      { userId },
      { ...newFilters, userId },
      { upsert: true, new: true },
    );

    res.json({ success: true, message: 'Filters saved!', filters: newFilters });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

export default router;
