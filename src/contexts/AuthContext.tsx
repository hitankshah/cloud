import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User as UserProfile } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { signUpSchema, signInSchema, guestInfoSchema } from '../lib/validations';
import { sanitizeInput, loginRateLimiter, signupRateLimiter } from '../lib/security';

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Fetch user profile from DB
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        // console.error('Profile fetch error:', error);
        setUserProfile(null);
        return;
      }
      
      if (profile) {
        setUserProfile(profile as UserProfile);
      } else {
        // Create fallback profile if user not found in DB
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const fallbackProfile: UserProfile = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || 'User',
            phone: authUser.user_metadata?.phone || '',
            role: 'customer',
            created_at: new Date().toISOString()
          };
          setUserProfile(fallbackProfile);
        }
      }
    } catch (error) {
      // console.error('Unexpected profile fetch error:', error);
      setUserProfile(null);
    }
  };

  // Listen for auth changes and fetch profile
  useEffect(() => {
    let mounted = true;
    let initialLoadDone = false;
    
    const handleAuth = async (_event: string, session: any) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);
        setGuestInfo(null);
        await fetchProfile(session.user.id);
        if (mounted) setLoading(false);
      } else {
        setUser(null);
        setUserProfile(null);
        setGuestInfo(null);
        setIsGuest(false);
        if (mounted) setLoading(false);
      }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuth);
    
    // Get initial session only once
    if (!initialLoadDone) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted) {
          initialLoadDone = true;
          handleAuth('INITIAL_SESSION', session);
        }
      });
    }
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auth actions
  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      // Rate limiting check
      if (!signupRateLimiter.isAllowed(email)) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      
      // Validate input with Zod
      const validatedData = signUpSchema.parse({
        email: sanitizeInput(email),
        password,
        fullName: sanitizeInput(fullName),
        phone: sanitizeInput(phone)
      });
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: { 
          data: { 
            full_name: validatedData.fullName, 
            phone: validatedData.phone, 
            role: 'customer' 
          } 
        }
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists.');
        } else if (error.message.includes('Password should be')) {
          throw new Error('Password must be at least 6 characters long.');
        }
        throw error;
      }
      
      if (data.user) {
        try {
          await supabase.from('users').insert({
            id: data.user.id,
            email: validatedData.email,
            full_name: validatedData.fullName,
            phone: validatedData.phone,
            role: 'customer',
          });
        } catch (dbError) {
          // Don't throw here - user is created in auth, profile can be created later
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Rate limiting check
      if (!loginRateLimiter.isAllowed(email)) {
        throw new Error('Too many login attempts. Please wait 15 minutes and try again.');
      }
      
      // Validate input with Zod
      const validatedData = signInSchema.parse({
        email: sanitizeInput(email),
        password
      });
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email: validatedData.email, 
        password: validatedData.password 
      });
      
      if (error) {
        // Handle specific error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before signing in.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        }
        throw error;
      } else {
        // Reset rate limiter on successful login
        loginRateLimiter.reset(email);
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear guest state immediately
      setIsGuest(false);
      setGuestInfo(null);
      // Auth state change will handle the rest
    } catch (error) {
      // console.error('Sign out error:', error);
      throw error;
    }
  };

  const continueAsGuest = (info: GuestInfo) => {
    try {
      // Validate guest info with Zod
      const validatedInfo = guestInfoSchema.parse({
        fullName: sanitizeInput(info.fullName),
        phone: sanitizeInput(info.phone),
        email: sanitizeInput(info.email)
      });
      
      setUser(null);
      setUserProfile(null);
      setGuestInfo(validatedInfo);
      setIsGuest(true);
      setLoading(false);
    } catch (error) {
      throw new Error('Invalid guest information provided.');
    }
  };

  const createAdminUser = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'admin' } }
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone: '',
        role: 'admin',
      });
    }
    setLoading(false);
    return data;
  };

  const resendVerification = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
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