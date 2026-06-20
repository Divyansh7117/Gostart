// Shared TypeScript interfaces used across all routes.
// These describe the shape of API request/response bodies — separate from
// the Mongoose model interfaces which live in /models/*.

export interface SearchFilters {
  lookingFor: string;
  minAge: number;
  maxAge: number;
  location: string;
  religion: string | null;
  profession: string | null;
}

// In-memory only — searches are ephemeral (3 seconds), no need to persist in DB
export interface ActiveSearch {
  status: 'searching' | 'found' | 'not_found';
  userId: string;
  filters: Partial<SearchFilters>;
  result: ProfileResponse | null;
  startedAt: number;
  completedAt?: number;
}

// The shape of a profile as returned by the API (camelCase, clean)
export interface ProfileResponse {
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
}

export interface UserResponse {
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
}
