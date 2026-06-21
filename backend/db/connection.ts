// ====================================================================
// MongoDB Connection — connects via Mongoose, logs status, seeds data
//
// HOW IT WORKS:
//  1. Reads MONGO_URI from the .env file (or environment variables).
//  2. Mongoose opens a persistent connection pool — all models reuse it.
//  3. After connecting, seedInitialData() runs once:
//       - Seeds 5 realistic dating profiles if the collection is empty.
//       - Creates the demo@gostart.app account if it doesn't exist yet.
//
// TO SWITCH TO ATLAS:
//  Just change MONGO_URI in the .env file to your Atlas connection string.
//  No code changes needed.
// ====================================================================

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27017/gostart';

  await mongoose.connect(uri);
  console.log(`[MongoDB] Connected → ${uri}`);

  await seedInitialData();
}

// ── Seed: Dating Profiles ────────────────────────────────────────────────────

async function seedInitialData(): Promise<void> {
  await migrateConversations();
  await migrateOnboardingFlag();
  await seedProfiles();
  await ensureMaleProfiles();
  await seedDemoUser();
  await ensureDemoProfile();
}

// Give the demo account a matchable dating profile (same _id as the demo user)
// so a real account can match with it and test two-way chat. Demo is "male" so
// it shows up under "Looking for: Men".
async function ensureDemoProfile(): Promise<void> {
  const exists = await Profile.findById('user_demo');
  if (exists) return;

  await Profile.create({
    _id: 'user_demo',
    name: 'Demo User',
    age: 28,
    gender: 'male',
    city: 'Gurgaon',
    height: "5'10\"",
    religion: 'Hindu',
    profession: 'Working Professional',
    college: 'Demo University',
    distance: '2 km away',
    about: "Hi, I'm the demo account — match with me to test chatting end to end. I reply when you log in as demo@gostart.app.",
    tags: ['Demo', 'Friendly', 'Tester'],
    weekendVibe: 'Trying new cafes',
    firstDateIdea: 'Coffee and a long walk',
    loveLanguage: 'Quality Time',
    verified: true,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  });
  console.log('[MongoDB] Created matchable profile for the demo account.');
}

// Users created before the onboarding flow existed have no onboardingComplete
// field. Treat them as already onboarded so they aren't forced through it.
async function migrateOnboardingFlag(): Promise<void> {
  const result = await User.updateMany(
    { onboardingComplete: { $exists: false } },
    { $set: { onboardingComplete: true } },
  );
  if (result.modifiedCount > 0) {
    console.log(`[MongoDB] Marked ${result.modifiedCount} existing user(s) as onboarded.`);
  }
}

async function migrateConversations(): Promise<void> {
  const convos = await Conversation.find({ chatId: { $exists: false } });
  for (const conv of convos) {
    const chatId = [conv.userId, conv.profileId].sort().join('_');
    await Conversation.updateOne({ _id: conv._id }, { $set: { chatId } });
  }
  const msgs = await Message.find({ chatId: { $exists: false } });
  for (const msg of msgs) {
    if (msg.conversationId) {
      const conv = await Conversation.findById(msg.conversationId);
      if (conv?.chatId) {
        await Message.updateOne({ _id: msg._id }, { $set: { chatId: conv.chatId } });
      }
    }
  }
  if (convos.length > 0 || msgs.length > 0) {
    console.log(`[MongoDB] Migrated ${convos.length} conversations, ${msgs.length} messages to chatId format.`);
  }
}

async function seedProfiles(): Promise<void> {
  const count = await Profile.countDocuments();
  if (count > 0) return; // already seeded — skip

  const profiles = [
    {
      _id: 'profile_001',
      name: 'Aanya Sharma',
      age: 26,
      gender: 'female',
      city: 'Gurgaon',
      height: "5'4\"",
      religion: 'Hindu',
      profession: 'Product Designer',
      college: 'NID Ahmedabad',
      distance: '3 km away',
      about: "Coffee snob ☕ UI/UX enthusiast. Weekend hiker when I'm not rearranging my succulents. Looking for someone who can keep up with my reading recommendations.",
      tags: ['Coffee lover', 'Hiker', 'Design nerd', 'Book worm', 'Vegetarian'],
      weekendVibe: 'Hiking trail then rooftop dinner',
      firstDateIdea: 'Specialty coffee shop → art gallery nearby',
      loveLanguage: 'Quality Time',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80',
    },
    {
      _id: 'profile_002',
      name: 'Priya Mehta',
      age: 28,
      gender: 'female',
      city: 'Mumbai',
      height: "5'5\"",
      religion: 'Jain',
      profession: 'Investment Banker',
      college: 'IIM Bangalore',
      distance: '12 km away',
      about: "Spreadsheets by day, salsa dancer by night. Fluent in Excel, Cantonese, and sarcasm. Seeking someone who can match my energy and debate me on economics.",
      tags: ['Dancer', 'Foodie', 'Finance', 'Traveller', 'Night owl'],
      weekendVibe: 'Brunch → salsa class → wine bar',
      firstDateIdea: 'Rooftop restaurant with city views',
      loveLanguage: 'Acts of Service',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    },
    {
      _id: 'profile_003',
      name: 'Kavya Nair',
      age: 24,
      gender: 'female',
      city: 'Bangalore',
      height: "5'3\"",
      religion: 'Hindu',
      profession: 'Software Engineer',
      college: 'BITS Pilani',
      distance: '7 km away',
      about: 'Building products that matter at a climate tech startup. Obsessed with mechanical keyboards, open-source, and filter coffee. 0 drama, 100% kindness.',
      tags: ['Tech', 'Climate', 'Foodie', 'Introvert', 'Cat person'],
      weekendVibe: 'Farmers market → cooking something new',
      firstDateIdea: 'Escape room then craft brewery',
      loveLanguage: 'Words of Affirmation',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    },
    {
      _id: 'profile_004',
      name: 'Riya Kapoor',
      age: 29,
      gender: 'female',
      city: 'Delhi',
      height: "5'6\"",
      religion: 'Sikh',
      profession: 'Journalist',
      college: 'LSR Delhi',
      distance: '18 km away',
      about: "Senior reporter at a national daily. Ask me about anything geopolitical. On weekends I'm either at gurdwara or deep in a pottery class. Low-key, high-substance.",
      tags: ['News junkie', 'Pottery', 'Spiritual', 'Foodie', 'Early bird'],
      weekendVibe: 'Morning run → pottery class → home-cooked dal',
      firstDateIdea: 'Old Delhi food walk at sunset',
      loveLanguage: 'Physical Touch',
      verified: false,
      photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
    },
    {
      _id: 'profile_005',
      name: 'Sneha Iyer',
      age: 27,
      gender: 'female',
      city: 'Chennai',
      height: "5'2\"",
      religion: 'Hindu',
      profession: 'Architect',
      college: 'CEPT University',
      distance: '5 km away',
      about: 'Designing sustainable buildings and occasionally very unsustainable amounts of biryani. Carnatic classical vocalist, amateur astrophotographer, perpetual overthinker.',
      tags: ['Architecture', 'Music', 'Stargazing', 'Biryani', 'Sustainable living'],
      weekendVibe: 'Museum or heritage walk → astrophotography at night',
      firstDateIdea: 'Drive to a dark-sky spot with chai and telescope',
      loveLanguage: 'Quality Time',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
    },
    {
      _id: 'profile_006',
      name: 'Arjun Malhotra',
      age: 27,
      gender: 'male',
      city: 'Gurgaon',
      height: "6'1\"",
      religion: 'Hindu',
      profession: 'Software Engineer',
      college: 'IIT Delhi',
      distance: '4 km away',
      about: "Backend engineer at a Series B startup. Avid cyclist, amateur chef, and someone who actually reads the books on his shelf. Looking for a genuine connection over good food and better conversations.",
      tags: ['Cyclist', 'Foodie', 'Tech', 'Reader', 'Dog lover'],
      weekendVibe: 'Long bike rides then cooking something elaborate',
      firstDateIdea: 'Farmer\'s market brunch then a walk in Lodhi Garden',
      loveLanguage: 'Quality Time',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    },
    {
      _id: 'profile_007',
      name: 'Kabir Singhania',
      age: 30,
      gender: 'male',
      city: 'Mumbai',
      height: "5'11\"",
      religion: 'Sikh',
      profession: 'Working Professional',
      college: 'SP Jain',
      distance: '9 km away',
      about: "Strategy consultant by week, jazz pianist by weekend. I've lived in three countries and make the best dal makhani you'll ever have. Serious about the right things, funny about the rest.",
      tags: ['Music', 'Travel', 'Foodie', 'Fitness', 'Jazz'],
      weekendVibe: 'Live music gig or cooking for friends',
      firstDateIdea: 'Jazz bar with good cocktails and better conversation',
      loveLanguage: 'Acts of Service',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    },
    {
      _id: 'profile_008',
      name: 'Rohan Verma',
      age: 25,
      gender: 'male',
      city: 'Bangalore',
      height: "5'10\"",
      religion: 'Hindu',
      profession: 'Founder / Entrepreneur',
      college: 'NIT Trichy',
      distance: '6 km away',
      about: "Building a climate-tech startup. Trail runner, weekend photographer, and permanently planning a Spiti Valley trip. Looking for someone curious about the world and their place in it.",
      tags: ['Entrepreneur', 'Running', 'Photography', 'Sustainability', 'Mountains'],
      weekendVibe: 'Trail run at dawn → rooftop photography at dusk',
      firstDateIdea: 'Botanical garden walk then filter coffee at a tiny café',
      loveLanguage: 'Words of Affirmation',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    },
  ];

  await Profile.insertMany(profiles);
  console.log(`[MongoDB] Seeded ${profiles.length} profiles.`);
}

// Upsert the 3 male profiles — runs on every start so existing DBs get them too.
async function ensureMaleProfiles(): Promise<void> {
  const maleProfiles = [
    {
      _id: 'profile_006',
      name: 'Arjun Malhotra',
      age: 27,
      gender: 'male',
      city: 'Gurgaon',
      height: "6'1\"",
      religion: 'Hindu',
      profession: 'Software Engineer',
      college: 'IIT Delhi',
      distance: '4 km away',
      about: "Backend engineer at a Series B startup. Avid cyclist, amateur chef, and someone who actually reads the books on his shelf. Looking for a genuine connection over good food and better conversations.",
      tags: ['Cyclist', 'Foodie', 'Tech', 'Reader', 'Dog lover'],
      weekendVibe: 'Long bike rides then cooking something elaborate',
      firstDateIdea: "Farmer's market brunch then a walk in Lodhi Garden",
      loveLanguage: 'Quality Time',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    },
    {
      _id: 'profile_007',
      name: 'Kabir Singhania',
      age: 30,
      gender: 'male',
      city: 'Mumbai',
      height: "5'11\"",
      religion: 'Sikh',
      profession: 'Working Professional',
      college: 'SP Jain',
      distance: '9 km away',
      about: "Strategy consultant by week, jazz pianist by weekend. I've lived in three countries and make the best dal makhani you'll ever have. Serious about the right things, funny about the rest.",
      tags: ['Music', 'Travel', 'Foodie', 'Fitness', 'Jazz'],
      weekendVibe: 'Live music gig or cooking for friends',
      firstDateIdea: 'Jazz bar with good cocktails and better conversation',
      loveLanguage: 'Acts of Service',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    },
    {
      _id: 'profile_008',
      name: 'Rohan Verma',
      age: 25,
      gender: 'male',
      city: 'Bangalore',
      height: "5'10\"",
      religion: 'Hindu',
      profession: 'Founder / Entrepreneur',
      college: 'NIT Trichy',
      distance: '6 km away',
      about: "Building a climate-tech startup. Trail runner, weekend photographer, and permanently planning a Spiti Valley trip. Looking for someone curious about the world and their place in it.",
      tags: ['Entrepreneur', 'Running', 'Photography', 'Sustainability', 'Mountains'],
      weekendVibe: 'Trail run at dawn → rooftop photography at dusk',
      firstDateIdea: 'Botanical garden walk then filter coffee at a tiny café',
      loveLanguage: 'Words of Affirmation',
      verified: true,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    },
  ];

  for (const p of maleProfiles) {
    await Profile.findOneAndUpdate({ _id: p._id }, { $setOnInsert: p }, { upsert: true, new: true });
  }
}

// ── Seed: Demo User ──────────────────────────────────────────────────────────

async function seedDemoUser(): Promise<void> {
  const exists = await User.findOne({ email: 'demo@gostart.app' });
  if (exists) return;

  const passwordHash = await bcrypt.hash('demo123', 10);

  const demoUser = await User.create({
    _id: 'user_demo',
    name: 'Demo User',
    email: 'demo@gostart.app',
    passwordHash,
    age: 28,
    gender: 'male',
    credits: 5,
    onboardingComplete: true,
  });

  const chatId1 = [demoUser._id, 'profile_001'].sort().join('_');
  const chatId2 = [demoUser._id, 'profile_002'].sort().join('_');

  const conv1 = await Conversation.create({
    _id: 'conv_demo_001',
    userId: demoUser._id,
    profileId: 'profile_001',
    chatId: chatId1,
  });

  const conv2 = await Conversation.create({
    _id: 'conv_demo_002',
    userId: demoUser._id,
    profileId: 'profile_002',
    chatId: chatId2,
  });

  await Message.insertMany([
    { chatId: chatId1, conversationId: conv1._id, senderId: 'profile_001', text: 'Hey! Excited to chat 😊', timestamp: new Date(Date.now() - 3_600_000) },
    { chatId: chatId1, conversationId: conv1._id, senderId: demoUser._id, text: 'Same here! Tell me about your café recommendations in Gurgaon?', timestamp: new Date(Date.now() - 1_800_000) },
    { chatId: chatId1, conversationId: conv1._id, senderId: 'profile_001', text: 'Oh you HAVE to try Unplugged Courtyard in Cyber Hub!', timestamp: new Date(Date.now() - 900_000) },
    { chatId: chatId2, conversationId: conv2._id, senderId: 'profile_002', text: 'Hi there! Loved your profile.', timestamp: new Date(Date.now() - 86_400_000) },
  ]);

  console.log('[MongoDB] Demo user created  →  demo@gostart.app / demo123');
}
