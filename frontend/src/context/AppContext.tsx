// Global state via React Context.
// TypeScript makes this much safer — the context shape is enforced at every callsite.
// Any screen calling useApp() gets full autocomplete on user, credits, filters, etc.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, getFilters } from '../services/api';
import type { User, Filters } from '../types';

// The shape of everything the context exposes
interface AppContextValue {
  user: User | null;
  credits: number;
  filters: Filters;
  isLoggedIn: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  deductCredit: () => void;
  addCredits: (amount: number) => void;
  refreshCredits: () => Promise<void>;
  updateFilters: (f: Filters) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_FILTERS: Filters = {
  lookingFor: 'Women',
  minAge: 20,
  maxAge: 30,
  location: 'Nearby',
  religion: null,
  profession: null,
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(2);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On app start — check if user is already logged in via a stored JWT
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('@gostart_token');

      if (token) {
        const data = await getMe();
        if (data.success) {
          setUser(data.user);
          setCredits(data.user.credits);
          setIsLoggedIn(true);

          try {
            const filterData = await getFilters();
            if (filterData.success) setFilters(filterData.filters);
          } catch {
            // Filters failing is non-fatal — use defaults
          }
        } else {
          await logout();
        }
      }
    } catch {
      // No token or server unreachable — show login screen
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token: string): Promise<void> => {
    await AsyncStorage.setItem('@gostart_token', token);
    setUser(userData);
    setCredits(userData.credits);
    setIsLoggedIn(true);
  };

  const logout = async (): Promise<void> => {
    await AsyncStorage.removeItem('@gostart_token');
    setUser(null);
    setCredits(0);
    setIsLoggedIn(false);
  };

  // Optimistic credit deduction — update UI instantly, server already deducted on its end
  const deductCredit = (): void =>
    setCredits((prev) => Math.max(0, prev - 1));

  const addCredits = (amount: number): void =>
    setCredits((prev) => prev + amount);

  // Pull the true credit balance from the server (keeps the no-credits UI accurate)
  const refreshCredits = async (): Promise<void> => {
    try {
      const data = await getMe();
      if (data.success) {
        setUser(data.user);
        setCredits(data.user.credits);
      }
    } catch {
      /* offline / unauthorized — keep current state */
    }
  };

  const updateFilters = (f: Filters): void => setFilters(f);

  // Logged in but profile not yet completed → must go through onboarding first
  const needsOnboarding = isLoggedIn && !!user && user.onboardingComplete === false;

  return (
    <AppContext.Provider
      value={{
        user,
        credits,
        filters,
        isLoggedIn,
        isLoading,
        needsOnboarding,
        login,
        logout,
        setUser,
        deductCredit,
        addCredits,
        refreshCredits,
        updateFilters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
