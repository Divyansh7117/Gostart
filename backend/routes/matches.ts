// ====================================================================
// Match Search Routes
//
// HOW THE SEARCH WORKS:
//  1. POST /search      → registers a search in memory, returns searchId.
//  2. After 3 seconds   → queries MongoDB for a matching profile.
//  3. GET  /search/:id  → frontend polls this every second; returns
//                         { status: 'searching'|'found'|'not_found', match }.
//  4. POST /start-conversation → deducts 1 credit in MongoDB,
//                                creates a Conversation document.
//
// Active searches stay in-memory (not in MongoDB) because they're
// ephemeral — they only exist for the 3-second search window.
// ====================================================================

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Profile, IProfile } from '../models/Profile';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { ActiveSearch, SearchFilters, ProfileResponse } from '../types';

const router = Router();

// In-memory: searches are ephemeral (3 seconds), no need for DB persistence
const activeSearches: Record<string, ActiveSearch> = {};

// Convert a Mongoose Profile doc to a clean API response object
function toProfileResponse(p: IProfile): ProfileResponse {
  return {
    id: p._id as string,
    name: p.name,
    age: p.age,
    gender: p.gender,
    city: p.city,
    height: p.height,
    religion: p.religion,
    profession: p.profession,
    college: p.college,
    distance: p.distance,
    about: p.about,
    tags: p.tags,
    weekendVibe: p.weekendVibe,
    firstDateIdea: p.firstDateIdea,
    loveLanguage: p.loveLanguage,
    verified: p.verified,
    photo: p.photo,
  };
}

// ── Match Algorithm ──────────────────────────────────────────────────────────
// Queries MongoDB with the user's filter preferences, picks a random match.

async function findMatchingProfile(filters: Partial<SearchFilters>): Promise<ProfileResponse | null> {
  const { lookingFor, minAge, maxAge, location, religion, profession } = filters;

  // Map "Looking for" to gender values stored in the DB
  let targetGenders: string[] = [];
  if (lookingFor === 'Women') targetGenders = ['female'];
  else if (lookingFor === 'Men') targetGenders = ['male'];
  else if (lookingFor === 'LGBTQ+') targetGenders = ['male', 'female', 'non-binary'];
  else targetGenders = ['female'];

  // Build the MongoDB query object dynamically
  const query: Record<string, unknown> = {
    gender: { $in: targetGenders },
    age: { $gte: minAge ?? 18, $lte: maxAge ?? 99 },
  };

  if (religion && religion !== 'Any') query.religion = religion;
  if (profession && profession !== 'Any') query.profession = profession;

  let candidates = await Profile.find(query);

  // Prefer nearby profiles when location filter is set
  if (location === 'Nearby') {
    const nearby = candidates.filter((p) => parseInt(p.distance) <= 20);
    if (nearby.length > 0) candidates = nearby;
  } else if (location === 'Same City') {
    const sameCity = candidates.filter((p) => parseInt(p.distance) <= 50);
    if (sameCity.length > 0) candidates = sameCity;
  }

  if (candidates.length === 0) return null;

  // Random pick so each search can surface a different match
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return toProfileResponse(pick);
}

// POST /api/matches/search — kick off an async search
router.post('/search', authMiddleware, (req: Request, res: Response): void => {
  const { filters } = req.body as { filters: Partial<SearchFilters> };
  const { userId } = (req as AuthenticatedRequest).user;
  const searchId = uuidv4();

  activeSearches[searchId] = {
    status: 'searching',
    userId,
    filters: filters ?? {},
    result: null,
    startedAt: Date.now(),
  };

  // Simulate realistic matching latency, then query MongoDB
  setTimeout(() => {
    findMatchingProfile(filters ?? {})
      .then((match) => {
        activeSearches[searchId] = {
          ...activeSearches[searchId],
          status: match ? 'found' : 'not_found',
          result: match,
          completedAt: Date.now(),
        };
      })
      .catch((err) => {
        console.error('Match search error:', err);
        activeSearches[searchId] = { ...activeSearches[searchId], status: 'not_found', result: null };
      });
  }, 3000);

  res.json({ success: true, searchId, message: 'Search started.' });
});

// GET /api/matches/search/:searchId — poll for result (frontend calls this every ~1s)
router.get('/search/:searchId', authMiddleware, (req: Request, res: Response): void => {
  const { searchId } = req.params;
  const { userId } = (req as AuthenticatedRequest).user;
  const search = activeSearches[searchId];

  if (!search) {
    res.status(404).json({ success: false, message: 'Search not found or expired.' });
    return;
  }
  if (search.userId !== userId) {
    res.status(403).json({ success: false, message: 'Not authorized.' });
    return;
  }

  res.json({ success: true, status: search.status, match: search.result });
});

// POST /api/matches/start-conversation — deduct 1 credit, create Conversation doc
router.post('/start-conversation', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { profileId } = req.body as { profileId: string };
    const { userId } = (req as AuthenticatedRequest).user;

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    if (user.credits < 1) {
      res.status(402).json({ success: false, message: 'Not enough credits.', credits: 0 });
      return;
    }

    const profile = await Profile.findById(profileId);
    if (!profile) { res.status(404).json({ success: false, message: 'Profile not found.' }); return; }

    await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } });

    const chatId = [userId, profileId].sort().join('_');
    const conversationId = uuidv4();
    const conversation = await Conversation.findOneAndUpdate(
      { userId, profileId },
      { $setOnInsert: { _id: conversationId, userId, profileId, chatId } },
      { upsert: true, new: true },
    );

    const userProfile = await Profile.findById(userId);
    if (userProfile) {
      const mirrorId = uuidv4();
      await Conversation.findOneAndUpdate(
        { userId: profileId, profileId: userId },
        { $setOnInsert: { _id: mirrorId, userId: profileId, profileId: userId, chatId } },
        { upsert: true, new: true },
      );
    }

    const updatedUser = await User.findById(userId).select('credits');

    res.json({
      success: true,
      message: "Conversation started! You're now connected.",
      conversationId: conversation._id,
      creditsRemaining: updatedUser?.credits ?? user.credits - 1,
      match: toProfileResponse(profile),
    });
  } catch (err) {
    console.error('Start conversation error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

// GET /api/matches/my-matches — every profile the user has connected with,
// returned with full profile details + the conversationId so the frontend
// carousel can jump straight into the chat.
router.get('/my-matches', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;

    const convos = await Conversation.find({ userId }).sort({ createdAt: -1 });

    const matches = (
      await Promise.all(
        convos.map(async (conv) => {
          const profile = await Profile.findById(conv.profileId);
          if (!profile) return null;
          return { conversationId: conv._id, profile: toProfileResponse(profile) };
        }),
      )
    ).filter((m): m is { conversationId: string; profile: ProfileResponse } => m !== null);

    res.json({ success: true, matches });
  } catch (err) {
    console.error('My matches error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

export default router;
