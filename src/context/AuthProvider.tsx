import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { isAdmin, subscribeToUserProfile, watchAuth, type UserProfile } from '../lib/auth';

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
    return watchAuth((nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    return subscribeToUserProfile(user.uid, (nextProfile) => {
      setProfile(nextProfile);
      setLoading(false);
    });
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdminUser: isAdmin(profile),
    }),
    [user, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
