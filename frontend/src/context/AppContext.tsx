// using context so any screen can read user/credits/filters without prop drilling

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

interface AppContextValue {
  user: User | null;
  credits: number;
  filters: Filters;
  isLoggedIn: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  login: (user: User, token: string, remember?: boolean) => Promise<void>;
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

  // check stored JWT on app start to auto-restore the session
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('@gostart_token');
      const remember = await AsyncStorage.getItem('@gostart_remember');

      // if "remember me" was off, clear the token so we don't auto-login next time
      if (token && remember === '0') {
        await AsyncStorage.removeItem('@gostart_token');
        await AsyncStorage.removeItem('@gostart_remember');
        return;
      }

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
            // filters failing is non-fatal, defaults are fine
          }
        } else {
          await logout();
        }
      }
    } catch {
      // no token or server unreachable — just show the login screen
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token: string, remember = true): Promise<void> => {
    // always store the token for this session's API calls
    // the remember flag only controls whether we auto-login on the next app launch
    await AsyncStorage.setItem('@gostart_token', token);
    await AsyncStorage.setItem('@gostart_remember', remember ? '1' : '0');
    setUser(userData);
    setCredits(userData.credits);
    setIsLoggedIn(true);
  };

  const logout = async (): Promise<void> => {
    await AsyncStorage.removeItem('@gostart_token');
    await AsyncStorage.removeItem('@gostart_remember');
    setUser(null);
    setCredits(0);
    setIsLoggedIn(false);
  };

  // optimistic deduction — update the UI instantly, server already charged on its end
  const deductCredit = (): void =>
    setCredits((prev) => Math.max(0, prev - 1));

  const addCredits = (amount: number): void =>
    setCredits((prev) => prev + amount);

  // pull the real balance from the server to keep the no-credits gate accurate
  const refreshCredits = async (): Promise<void> => {
    try {
      const data = await getMe();
      if (data.success) {
        setUser(data.user);
        setCredits(data.user.credits);
      }
    } catch {
      // offline or unauthorized — keep what we have
    }
  };

  const updateFilters = (f: Filters): void => setFilters(f);

  // if profile isn't done yet, send them through onboarding before anything else
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
