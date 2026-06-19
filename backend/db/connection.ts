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
  await seedProfiles();
  await seedDemoUser();
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
  ];

  await Profile.insertMany(profiles);
  console.log(`[MongoDB] Seeded ${profiles.length} profiles.`);
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
  });

  // Seed two conversations so the Messages tab has content on first launch
  const conv1 = await Conversation.create({
    _id: 'conv_demo_001',
    userId: demoUser._id,
    profileId: 'profile_001',
  });

  const conv2 = await Conversation.create({
    _id: 'conv_demo_002',
    userId: demoUser._id,
    profileId: 'profile_002',
  });

  await Message.insertMany([
    { conversationId: conv1._id, senderId: 'profile_001', text: 'Hey! Excited to chat 😊', timestamp: new Date(Date.now() - 3_600_000) },
    { conversationId: conv1._id, senderId: demoUser._id, text: 'Same here! Tell me about your café recommendations in Gurgaon?', timestamp: new Date(Date.now() - 1_800_000) },
    { conversationId: conv1._id, senderId: 'profile_001', text: 'Oh you HAVE to try Unplugged Courtyard in Cyber Hub!', timestamp: new Date(Date.now() - 900_000) },
    { conversationId: conv2._id, senderId: 'profile_002', text: 'Hi there! Loved your profile.', timestamp: new Date(Date.now() - 86_400_000) },
  ]);

  console.log('[MongoDB] Demo user created  →  demo@gostart.app / demo123');
}
