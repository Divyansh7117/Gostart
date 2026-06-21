// All network calls to the backend go through this file.
// TypeScript interfaces give us compile-time safety on what the API returns.
// Screens never call fetch() directly — they import functions from here.
//
// BASE_URL auto-detects so it "just works" everywhere:
//   • Web:            http://localhost:3001/api
//   • Expo Go / device: http://<your-PC's-LAN-IP>:3001/api  (derived from the
//                       Metro/Expo host the app was loaded from)
//   • Android emulator: http://10.0.2.2:3001/api  (host loopback alias)
// Override anytime by setting EXPO_PUBLIC_API_URL in your environment.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Filters, User, Profile, Message, Conversation, FullConversation, CreditPackage, MatchSummary, MatchCandidate } from '../types';

const API_PORT = 3001;

function resolveBaseUrl(): string {
  // 1) Explicit override always wins
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, '');

  // 2) Web runs in the browser — same host as the page
  if (Platform.OS === 'web') return `http://localhost:${API_PORT}/api`;

  // 3) Native (Expo Go / dev build): reuse the host Metro served the bundle from,
  //    which is your computer's LAN IP — so the phone hits the right machine.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost ||
    (Constants.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } } | undefined)?.extra?.expoGo?.debuggerHost;

  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${API_PORT}/api`;

  // 4) Last-resort fallbacks
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}/api`;
  return `http://localhost:${API_PORT}/api`;
}

export const BASE_URL = resolveBaseUrl();

// ── Response shapes ────────────────────────────────────────────────────────────

interface ApiSuccess {
  success: true;
}

interface AuthResponse extends ApiSuccess {
  token: string;
  user: User;
}

interface MeResponse extends ApiSuccess {
  user: User;
}

interface CreditsResponse extends ApiSuccess {
  credits: number;
  packages: CreditPackage[];
}

interface FiltersResponse extends ApiSuccess {
  filters: Filters;
}

interface SearchStartResponse extends ApiSuccess {
  searchId: string;
  message: string;
}

interface SearchPollResponse extends ApiSuccess {
  status: 'searching' | 'found' | 'not_found';
  matches: MatchCandidate[];
  match: MatchCandidate | null;
}

interface StartConversationResponse extends ApiSuccess {
  conversationId: string;
  creditsRemaining: number;
  match: Profile;
  message: string;
  alreadyConnected: boolean;
}

interface ConversationsResponse extends ApiSuccess {
  conversations: Conversation[];
}

interface MyMatchesResponse extends ApiSuccess {
  matches: MatchSummary[];
}

// Profile fields the onboarding flow can save
export interface ProfileInput {
  name?: string;
  age?: number;
  gender?: string;
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
}

interface ConversationResponse extends ApiSuccess {
  conversation: FullConversation;
}

interface SendMessageResponse extends ApiSuccess {
  message: Message;
}

interface PaymentInitResponse extends ApiSuccess {
  orderId: string;
  amount: number;
  currency: string;
  packageId: string;
  credits: number;
  keyId: string;
}

interface PaymentConfirmResponse extends ApiSuccess {
  credits: number;
  paymentId: string;
  message: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const getToken = async (): Promise<string | null> =>
  AsyncStorage.getItem('@gostart_token');

const authHeaders = async (): Promise<HeadersInit_> => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token ?? ''}`,
  };
};

const REQUEST_TIMEOUT_MS = 12000;

// Generic fetch wrapper — throws with the server's message on non-OK status.
// Includes a timeout so a request to an unreachable backend fails fast with a
// clear message instead of leaving the UI spinning forever.
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Can't reach the server at ${BASE_URL}. Make sure the backend is running and reachable from this device.`);
    }
    throw new Error(`Network error reaching ${BASE_URL}. Check your connection and that the backend is running.`);
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json() as T & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? 'Something went wrong.');
  }

  return data;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export const loginUser = (email: string, password: string) =>
  apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

export const registerUser = (
  name: string,
  email: string,
  password: string,
  age: number,
  gender: string,
  profile: {
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
  } = {},
) =>
  apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, age, gender, ...profile }),
  });

export const getMe = async () =>
  apiFetch<MeResponse>('/auth/me', { headers: await authHeaders() });

// Save full profile (onboarding) — marks onboarding complete server-side
export const saveProfile = async (profile: ProfileInput) =>
  apiFetch<MeResponse>('/auth/profile', {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(profile),
  });

// ── Credits ────────────────────────────────────────────────────────────────────

export const getCredits = async () =>
  apiFetch<CreditsResponse>('/credits', { headers: await authHeaders() });

export const initiatePayment = async (packageId: string) =>
  apiFetch<PaymentInitResponse>('/credits/initiate-payment', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ packageId }),
  });

export const confirmPayment = async (
  packageId: string,
  paymentId: string,
  orderId: string,
) =>
  apiFetch<PaymentConfirmResponse>('/credits/confirm-payment', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ packageId, paymentId, orderId }),
  });

// ── Filters ────────────────────────────────────────────────────────────────────

export const getFilters = async () =>
  apiFetch<FiltersResponse>('/filters', { headers: await authHeaders() });

export const saveFilters = async (filters: Filters) =>
  apiFetch<FiltersResponse>('/filters', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(filters),
  });

// ── Matches ────────────────────────────────────────────────────────────────────

export const startSearch = async (filters: Filters) =>
  apiFetch<SearchStartResponse>('/matches/search', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ filters }),
  });

export const pollSearch = async (searchId: string) =>
  apiFetch<SearchPollResponse>(`/matches/search/${searchId}`, {
    headers: await authHeaders(),
  });

export const startConversation = async (profileId: string) =>
  apiFetch<StartConversationResponse>('/matches/start-conversation', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ profileId }),
  });

export const getMyMatches = async () =>
  apiFetch<MyMatchesResponse>('/matches/my-matches', { headers: await authHeaders() });

export const getProfile = async (id: string) =>
  apiFetch<{ success: true; profile: Profile }>(`/profiles/${id}`, { headers: await authHeaders() });

// ── Messages ───────────────────────────────────────────────────────────────────

export const getConversations = async () =>
  apiFetch<ConversationsResponse>('/messages', { headers: await authHeaders() });

export const getConversation = async (conversationId: string) =>
  apiFetch<ConversationResponse>(`/messages/${conversationId}`, {
    headers: await authHeaders(),
  });

export const sendMessage = async (conversationId: string, text: string) =>
  apiFetch<SendMessageResponse>(`/messages/${conversationId}/send`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ text }),
  });
