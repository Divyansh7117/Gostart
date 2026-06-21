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
import { UserFilter } from '../models/UserFilter';
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
// Queries MongoDB with the user's filter preferences, returns up to `limit`
// matching profiles (shuffled) so the user can browse and choose who to talk to.

const MAX_MATCHES = 3;

// Map a lookingFor string to the set of genders it targets
function lookingForGenders(lookingFor: string): string[] {
  if (lookingFor === 'Women') return ['female'];
  if (lookingFor === 'Men')   return ['male'];
  if (lookingFor === 'LGBTQ+') return ['male', 'female', 'non-binary'];
  return ['female'];
}

// Default lookingFor for seeded profiles that have no UserFilter record
function defaultLookingFor(gender: string): string {
  if (gender === 'male')   return 'Women';
  if (gender === 'female') return 'Men';
  return 'LGBTQ+';
}

async function findMatchingProfiles(
  filters: Partial<SearchFilters>,
  selfId: string,
  selfGender: string,       // the searcher's own gender
  limit = MAX_MATCHES,
): Promise<ProfileResponse[]> {
  const { lookingFor, minAge, maxAge, location, religion, profession } = filters;

  // Step 1 — filter by what the searcher wants
  const targetGenders = lookingForGenders(lookingFor ?? 'Women');

  const query: Record<string, unknown> = {
    _id: { $ne: selfId },
    gender: { $in: targetGenders },
    age: { $gte: minAge ?? 18, $lte: maxAge ?? 99 },
  };
  if (religion && religion !== 'Any') query.religion = religion;
  if (profession && profession !== 'Any') query.profession = profession;

  let candidates = await Profile.find(query);

  // Step 2 — bidirectional check: keep only candidates who are also
  // interested in the searcher's gender.
  const candidateIds = candidates.map((c) => String(c._id));
  const savedFilters = await UserFilter.find({ userId: { $in: candidateIds } });
  const filterMap = new Map(savedFilters.map((f) => [f.userId, f.lookingFor]));

  candidates = candidates.filter((c) => {
    const theirLookingFor = filterMap.get(String(c._id));
    // Seeded/unregistered profiles have no saved filter — treat as open to anyone.
    if (!theirLookingFor) return true;
    const theyWant = lookingForGenders(theirLookingFor);
    return theyWant.includes(selfGender);
  });

  // Location preference
  if (location === 'Nearby') {
    const nearby = candidates.filter((p) => parseInt(p.distance) <= 20);
    if (nearby.length > 0) candidates = nearby;
  } else if (location === 'Same City') {
    const sameCity = candidates.filter((p) => parseInt(p.distance) <= 50);
    if (sameCity.length > 0) candidates = sameCity;
  }

  // Shuffle (Fisher–Yates) then take `limit`
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return candidates.slice(0, limit).map(toProfileResponse);
}

// POST /api/matches/search — kick off an async search
router.post('/search', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { filters } = req.body as { filters: Partial<SearchFilters> };
  const { userId } = (req as AuthenticatedRequest).user;

  // Fetch the searcher's gender for the bidirectional filter
  const searcher = await User.findById(userId).select('gender');
  const selfGender = searcher?.gender ?? 'male';

  const searchId = uuidv4();

  activeSearches[searchId] = {
    status: 'searching',
    userId,
    filters: filters ?? {},
    results: [],
    startedAt: Date.now(),
  };

  // Simulate realistic matching latency, then query MongoDB
  setTimeout(() => {
    findMatchingProfiles(filters ?? {}, userId, selfGender)
      .then((matches) => {
        activeSearches[searchId] = {
          ...activeSearches[searchId],
          status: matches.length > 0 ? 'found' : 'not_found',
          results: matches,
          completedAt: Date.now(),
        };
      })
      .catch((err) => {
        console.error('Match search error:', err);
        activeSearches[searchId] = { ...activeSearches[searchId], status: 'not_found', results: [] };
      });
  }, 3000);

  res.json({ success: true, searchId, message: 'Search started.' });
});

// GET /api/matches/search/:searchId — poll for result (frontend calls this every ~1s)
router.get('/search/:searchId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
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

  // Tag each match with whether the user already has a conversation with them,
  // so the UI can show "Continue Conversation" (free) instead of "Start" (1 credit).
  let matches: Array<ProfileResponse & { alreadyConnected: boolean; conversationId: string | null }> = [];
  if (search.results.length > 0) {
    const convos = await Conversation.find({ userId }).select('profileId _id');
    const convByProfile = new Map(convos.map((c) => [c.profileId, c._id as string]));
    matches = search.results.map((p) => ({
      ...p,
      alreadyConnected: convByProfile.has(p.id),
      conversationId: convByProfile.get(p.id) ?? null,
    }));
  }

  res.json({
    success: true,
    status: search.status,
    matches,
    // back-compat: single first match
    match: matches[0] ?? null,
  });
});

// POST /api/matches/start-conversation — open a chat with a matched profile.
// Costs 1 credit for a NEW connection; reconnecting with someone you've already
// talked to is free (no deduction) and just returns the existing conversation.
router.post('/start-conversation', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { profileId } = req.body as { profileId: string };
    const { userId } = (req as AuthenticatedRequest).user;

    const user = await User.findById(userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    const profile = await Profile.findById(profileId);
    if (!profile) { res.status(404).json({ success: false, message: 'Profile not found.' }); return; }

    // Already connected? Return the existing chat — no credit charged.
    const existing = await Conversation.findOne({ userId, profileId });
    if (existing) {
      res.json({
        success: true,
        alreadyConnected: true,
        message: 'Welcome back — picking up where you left off.',
        conversationId: existing._id,
        creditsRemaining: user.credits,
        match: toProfileResponse(profile),
      });
      return;
    }

    // New connection — requires a credit
    if (user.credits < 1) {
      res.status(402).json({ success: false, message: 'Not enough credits.', credits: 0 });
      return;
    }

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
      alreadyConnected: false,
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
