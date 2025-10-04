import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User as UserProfile } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Add a small delay to ensure session is fully established
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 100);
        setIsGuest(false);
        setGuestInfo(null);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        console.log('Auth state change:', event, session?.user?.id);
        setUser(session?.user ?? null);
        if (session?.user && event === 'SIGNED_IN') {
          // Add a delay for sign in events to ensure session is established
          setTimeout(async () => {
            await fetchProfile(session.user.id);
          }, 200);
          setIsGuest(false);
          setGuestInfo(null);
        } else if (session?.user && event === 'TOKEN_REFRESHED') {
          // For token refresh, fetch immediately
          await fetchProfile(session.user.id);
          setIsGuest(false);
          setGuestInfo(null);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Check if user is authenticated before making the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No active session when fetching profile');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // Handle specific permission errors
        if (error.code === '42501') {
          console.warn('Permission denied - RLS policy may not be applied or user not in database');
          // Try to create the user profile if it doesn't exist
          await createUserProfileIfNeeded(userId, session.user.email || '');
          return;
        }
        throw error;
      }
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfileIfNeeded = async (userId: string, email: string) => {
    try {
      // Check if user exists first
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingUser) {
        // User doesn't exist, create them
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email,
            full_name: '',
            phone: '',
            role: 'customer'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user profile:', error);
        } else {
          setUserProfile(data);
        }
      }
    } catch (error) {
      console.error('Error checking/creating user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      // Map common status codes to friendlier messages
      const status = (error as any).status;
      if (status === 429) throw new Error('Too many requests. Please try again later.');
      if (status === 401) throw new Error('Unauthorized. Please check your credentials.');
      throw error;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
          role: 'customer',
        });

      if (profileError) throw profileError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const status = (error as any).status;
      if (status === 429) throw new Error('Too many attempts. Please wait a moment and try again.');
      if (status === 401) throw new Error('Invalid email or password.');
      throw error;
    }
  };

  const createAdminUser = async (email: string, password: string, fullName: string) => {
    // This is a special function to create admin users
    // Should only be used for initial setup
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
      // Create the user profile with admin role
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone: '',
          role: 'admin',
        });

      if (profileError) {
        console.warn('Profile creation error (user may already exist):', profileError);
      }
    }
    return data;
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });
    
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsGuest(false);
    setGuestInfo(null);
  };

  const continueAsGuest = (info: GuestInfo) => {
    // Guest users are not authenticated; set isGuest flag and store guest info
    setUser(null);
    setUserProfile(null);
    setGuestInfo(info);
    setIsGuest(true);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, guestInfo, loading, isGuest, signUp, signIn, signOut, continueAsGuest, createAdminUser, resendVerification, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
