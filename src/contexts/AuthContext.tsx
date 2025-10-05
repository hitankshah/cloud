import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User as UserProfile } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
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
          setUserProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      console.log("Fetched user profile:", data);
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    if (data.user) {
      // Determine role based on email
      const role = email === 'admin@bhojanalay.com' ? 'admin' : 'customer';
      
      // Wait a moment for the user to be fully created in auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
          role,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError.message);
        // Don't throw here as the user is created in auth
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in with:', { email });
    
    try {
      // For admin login, handle it specially
      if (email === 'admin@bhojanalay.com' && password === 'Admin@2001') {
        console.log('Admin login attempt detected');
        
        try {
          // Try normal sign in first
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) {
            console.log('Admin sign in failed, attempting signup:', error.message);
            
            // If sign in fails, try to sign up the admin user
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password
            });
            
            if (signUpError) {
              console.error('Admin signup also failed:', signUpError.message);
              throw signUpError;
            }
            
            if (signUpData.user) {
              console.log('Admin user created successfully');
              
              // Wait a moment for the user to be fully created
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Create admin profile
              const { error: profileError } = await supabase
                .from('users')
                .insert({
                  id: signUpData.user.id,
                  email,
                  full_name: 'Administrator',
                  phone: '',
                  role: 'admin',
                });
                
              if (profileError) {
                console.error('Error creating admin profile:', profileError.message);
                // Don't throw here, as the user is created in auth
              }
              
              setUser(signUpData.user);
              await fetchProfile(signUpData.user.id);
              return;
            }
          } else if (data.user) {
            console.log('Admin sign in successful');
            setUser(data.user);
            await fetchProfile(data.user.id);
            
            // Ensure admin role is set
            const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('id', data.user.id)
              .maybeSingle();
            
            if (!userData || userData.role !== 'admin') {
              console.log('Setting admin role in database');
              await supabase
                .from('users')
                .upsert({
                  id: data.user.id,
                  email: 'admin@bhojanalay.com',
                  full_name: 'Administrator',
                  role: 'admin'
                });
              
              // Refresh profile
              await fetchProfile(data.user.id);
            }
            return;
          }
        } catch (adminError: any) {
          console.error('Admin login process error:', adminError.message);
          throw adminError;
        }
      } else {
        // Regular user login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error('Regular sign in error:', error.message);
          throw error;
        }
        
        if (data.user) {
          console.log('Regular sign in successful');
          setUser(data.user);
          await fetchProfile(data.user.id);
        }
      }
    } catch (error: any) {
      console.error('Sign in process error:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = () => {
    // Log current auth state
    console.log('Auth state:', { user, userProfile });
    
    // First check if we have a user
    if (!user) {
      console.log('No authenticated user');
      return false;
    }
    
    // If we have a user but no profile yet, assume it might be admin if email matches
    if (!userProfile) {
      const isAdminEmail = user.email === 'admin@bhojanalay.com';
      console.log('No profile loaded yet, checking email only:', isAdminEmail);
      return isAdminEmail;
    }
    
    // If we have both user and profile, check both email and role
    const hasAdminRole = userProfile.role === 'admin';
    const isAdminEmail = userProfile.email === 'admin@bhojanalay.com';
    
    console.log('Full admin check:', { hasAdminRole, isAdminEmail });
    
    // For admin@bhojanalay.com, we'll be more lenient on role check
    // This ensures admin can log in even if role is not set correctly in DB
    if (isAdminEmail) {
      console.log('Admin email confirmed, allowing access');
      return true;
    }
    
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signUp, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
