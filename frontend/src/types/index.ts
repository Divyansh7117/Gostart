// Central type definitions for the whole app.
// Every screen, component, and service imports from here — no duplicated interfaces.

// ── User / Auth ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  credits: number;
  city?: string;
  height?: string;
  religion?: string;
  profession?: string;
  college?: string;
  about?: string;
  tags?: string[];
  weekendVibe?: string;
  firstDateIdea?: string;
  loveLanguage?: string;
  photo?: string;
  distance?: string;
  onboardingComplete?: boolean;
}

// ── Match Profiles ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  height: string;
  religion: string;
  profession: string;
  college?: string;
  distance: string;
  about: string;
  tags: string[];
  weekendVibe: string;
  firstDateIdea: string;
  loveLanguage: string;
  verified: boolean;
  photo: string;
  userCity?: string;
  userAbout?: string;
  userTags?: string[];
  userWeekendVibe?: string;
  userFirstDateIdea?: string;
  userLoveLanguage?: string;
}

// ── Filters ────────────────────────────────────────────────────────────────────

export interface Filters {
  lookingFor: string;
  minAge: number;
  maxAge: number;
  location: string;
  religion: string | null;
  profession: string | null;
}

// ── Messages / Chat ────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface ConversationProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  photo: string;
  verified: boolean;
}

export interface Conversation {
  id: string;
  profile: ConversationProfile;
  lastMessage: Message | null;
  unreadCount: number;
}

export interface FullConversation {
  id: string;
  profile: Profile;
  messages: Message[];
}

// A matched profile plus the conversation it belongs to (for the matches carousel)
export interface MatchSummary {
  conversationId: string;
  profile: Profile;
}

// ── Credits ────────────────────────────────────────────────────────────────────

export interface CreditPackage {
  id: string;
  credits: number;
  priceINR: number;
  label: string;
  description: string;
}

// ── Community ──────────────────────────────────────────────────────────────────

export interface CommunityPost {
  id: string;
  type: 'success_story' | 'tip';
  title: string;
  body: string;
  author: string;
  emoji: string;
  likes: number;
}

// ── Navigation Param Lists ─────────────────────────────────────────────────────
// React Navigation uses these to type-check route params at compile time.

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type FindMatchStackParamList = {
  FindMatch: undefined;
  Searching: { filters: Filters };
  NoMatch: undefined;
  MatchRevealed: { match: Profile };
  BuyCredits: undefined;
};

export type MessagesStackParamList = {
  MessagesList: undefined;
  MatchesCarousel: undefined;
  Chat: { conversationId: string; match: Profile };
  MatchProfile: { profile: Profile };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  BuyCreditsProfile: undefined;
  Notifications: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  Terms: undefined;
};

export type MainTabParamList = {
  FindMatchTab: NavigatorScreenParams<FindMatchStackParamList>;
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>;
  CommunityTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// NavigatorScreenParams lets us nest stacks inside tabs with correct types
import type { NavigatorScreenParams } from '@react-navigation/native';
