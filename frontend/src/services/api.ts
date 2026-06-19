// All network calls to the backend go through this file.
// TypeScript interfaces give us compile-time safety on what the API returns.
// Screens never call fetch() directly — they import functions from here.
//
// For physical device testing, change BASE_URL:
//   iOS Simulator:    http://localhost:3001/api
//   Android Emulator: http://10.0.2.2:3001/api
//   Real device:      http://<your-local-IP>:3001/api

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Filters, User, Profile, Message, Conversation, FullConversation, CreditPackage } from '../types';

export const BASE_URL = 'http://localhost:3001/api';

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
  match: Profile | null;
}

interface StartConversationResponse extends ApiSuccess {
  conversationId: string;
  creditsRemaining: number;
  match: Profile;
  message: string;
}

interface ConversationsResponse extends ApiSuccess {
  conversations: Conversation[];
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

// Generic fetch wrapper — throws with the server's message on non-OK status
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
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
) =>
  apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, age, gender }),
  });

export const getMe = async () =>
  apiFetch<MeResponse>('/auth/me', { headers: await authHeaders() });

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
