import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase, User as UserProfile } from '../lib/supabase';
import { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';

export interface GuestInfo {
  fullName: string;
  phone: string;
  email: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  guestInfo: GuestInfo | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: (guestInfo: GuestInfo) => void;
  createAdminUser: (email: string, password: string, fullName: string) => Promise<any>;
  resendVerification: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  
  // Refs for managing state
  const isMountedRef = useRef(true);
  const profileFetchInFlight = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Profile fetching function
  const fetchProfile = async (userId: string) => {
    if (!userId || profileFetchInFlight.current || !isMountedRef.current) {
      return;
    }

    // Prevent duplicate fetches for the same user
    if (lastFetchedUserId.current === userId) {
      return;
    }

    profileFetchInFlight.current = true;
    lastFetchedUserId.current = userId;

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        return;
      }

      if (profile && isMountedRef.current) {
        setUserProfile(profile as UserProfile);
      } else if (isMountedRef.current) {
        // Create fallback profile if not found
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const fallbackProfile: UserProfile = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || 'User',
            phone: authUser.user_metadata?.phone || '',
            role: (authUser.user_metadata?.role as UserProfile['role']) || 'customer',
            created_at: authUser.created_at || new Date().toISOString()
          };
          setUserProfile(fallbackProfile);
        }
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      profileFetchInFlight.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthChange = async (event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      
      console.log(`🔐 Auth event: ${event}`, session?.user?.email || 'no user');
      
      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
        setGuestInfo(null);
        await fetchProfile(session.user.id);
      } else if (mounted) {
        setUser(null);
        setUserProfile(null);
        setGuestInfo(null);
        setIsGuest(false);
        setLoading(false);
        lastFetchedUserId.current = null;
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }}) => {
      if (mounted) {
        handleAuthChange(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              email,
              phone,
              role: 'customer'
            }
          ]);

        if (profileError) {
          console.warn('Profile creation warning:', profileError);
        }
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      setLoading(false);
      throw error;
    }
    // Loading will be set to false by auth state change handler
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      lastFetchedUserId.current = null;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const continueAsGuest = (info: GuestInfo) => {
    setUser(null);
    setUserProfile(null);
    setGuestInfo(info);
    setIsGuest(true);
    setLoading(false);
  };

  const createAdminUser = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'admin'
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              full_name: fullName,
              email,
              role: 'admin'
            }
          ]);

        if (profileError) {
          console.warn('Admin profile creation warning:', profileError);
        }
        return data;
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error resending verification:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    guestInfo,
    loading,
    isGuest,
    signUp,
    signIn,
    signOut,
    continueAsGuest,
    createAdminUser,
    resendVerification,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};