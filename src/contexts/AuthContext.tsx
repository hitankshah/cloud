import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

type Role = 'customer' | 'restaurant_owner' | 'guest' | 'admin';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: Exclude<Role, 'guest' | 'admin'>) => Promise<void>;
  adminSignIn: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsGuest: (displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const GUEST_PROFILE_KEY = 'cloud_guest_profile';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else if (typeof window !== 'undefined') {
        const storedGuest = window.localStorage.getItem(GUEST_PROFILE_KEY);
        if (storedGuest) {
          try {
            const guestProfile = JSON.parse(storedGuest) as Profile;
            setProfile(guestProfile);
          } catch (error) {
            console.error('Error parsing guest profile:', error);
            window.localStorage.removeItem(GUEST_PROFILE_KEY);
          }
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(GUEST_PROFILE_KEY);
          }
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminSignIn = async (email: string, password: string) => {
    // Only allow login if user is admin in DB
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profileData || profileData.role !== 'admin') {
        throw new Error('Not authorized as admin');
      }
      setProfile(profileData);
    }
  };
  const signUp = async (email: string, password: string, fullName: string, role: Exclude<Role, 'guest' | 'admin'>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
        });

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signInAsGuest = async (displayName?: string) => {
    const guestProfile: Profile = {
      id: 'guest',
      email: 'guest@cloudkitchen.local',
      full_name: displayName?.trim() || 'Guest Diner',
      role: 'guest',
    };

    setUser(null);
    setProfile(guestProfile);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(guestProfile));
    }
    setLoading(false);
  };

  const signOut = async () => {
    if (profile?.role === 'guest') {
      setUser(null);
      setProfile(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(GUEST_PROFILE_KEY);
      }
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signInAsGuest, adminSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
