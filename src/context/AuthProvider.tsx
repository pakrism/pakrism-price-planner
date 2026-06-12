import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { isAdmin, subscribeToUserProfile, watchAuth, type UserProfile } from '../lib/auth';

const AUTH_TIMEOUT_MS = 5000;

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdminUser: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAdminUser: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let resolved = false;

    function finish(nextUser: User | null) {
      resolved = true;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      if (!resolved) {
        console.warn('Auth check timed out — showing login.');
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = watchAuth(finish);

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    setLoading(true);
    return subscribeToUserProfile(
      user.uid,
      (nextProfile) => {
        setProfile(nextProfile);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdminUser: isAdmin(profile),
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
