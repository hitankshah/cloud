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
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setIsGuest(false);
        setGuestInfo(null);
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
        setIsGuest(false);
        setGuestInfo(null);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for user:', userId);
    try {
      // Get auth user for metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.error('No authenticated user found');
        setLoading(false);
        return;
      }

      // Try to fetch from users table
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        console.log('Profile found in database:', data);
        setUserProfile(data as UserProfile);
        setLoading(false);
        return;
      }

      console.log('Profile not found in database, auto-creating...');
      
      // Profile doesn't exist - create it
      const newProfile = {
        id: userId,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'User',
        phone: authUser.user_metadata?.phone || '',
        role: authUser.user_metadata?.role || 'customer'
      };

      // Try to insert the profile
      const { data: insertedData, error: insertError } = await supabase
        .from('users')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create profile in database:', insertError);
        console.log('Using metadata profile (database insert failed due to RLS)');
        
        // Set profile from metadata even if DB insert fails
        setUserProfile({
          ...newProfile,
          created_at: authUser.created_at || new Date().toISOString()
        });
      } else {
        console.log('Profile created successfully:', insertedData);
        setUserProfile(insertedData);
      }
      
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      
      // Final fallback to auth metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        console.log('Using fallback metadata profile');
        setUserProfile({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || 'User',
          phone: authUser.user_metadata?.phone || '',
          role: authUser.user_metadata?.role || 'customer',
          created_at: authUser.created_at || new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: 'customer'
        }
      }
    });

    if (error) {
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

      if (profileError) {
        console.warn('Profile creation error (may already exist):', profileError);
        // Don't throw - the user is created in auth, profile can be created later
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      console.error('Sign in error:', error);
      const status = (error as any).status;
      if (status === 429) throw new Error('Too many attempts. Please wait a moment and try again.');
      if (status === 400 || status === 401) throw new Error('Invalid email or password.');
      throw error;
    }
    
    console.log('Sign in successful:', data.user?.id);
    
    // The onAuthStateChange listener will handle profile fetching
    return;
  };

  const createAdminUser = async (email: string, password: string, fullName: string) => {
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
    setUser(null);
    setUserProfile(null);
    setGuestInfo(info);
    setIsGuest(true);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};