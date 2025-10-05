import { useState, useEffect } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('admin@bhojanalay.com'); // Pre-fill for convenience
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const { signIn, userProfile } = useAuth();
  const { addNotification } = useNotification();

  // Debug function to check admin user exists
  const debugAdminUser = async () => {
    setDebugging(true);
    try {
      // Check if user exists in users table
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('email', 'admin@bhojanalay.com');

      if (error) {
        console.error('Debug error:', error);
        addNotification(`Database error: ${error.message}`, 'error');
        return;
      }

      if (!users || users.length === 0) {
        addNotification('Admin user not found in users table. Check the database.', 'error');
        console.log('No admin user found with email: admin@bhojanalay.com');
        return;
      }

      const adminUser = users[0];
      console.log('Admin user found:', adminUser);
      
      if (adminUser.role !== 'admin') {
        addNotification(`User found but role is '${adminUser.role}', not 'admin'`, 'error');
      } else {
        addNotification(`Admin user found: ${adminUser.full_name} (${adminUser.email})`, 'success');
      }

    } catch (error: any) {
      console.error('Debug error:', error);
      addNotification(error.message, 'error');
    } finally {
      setDebugging(false);
    }
  };

  // Check if user is already admin
  useEffect(() => {
    if (userProfile?.role === 'admin') {
      onSuccess();
    }
  }, [userProfile, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, sign in the user
      await signIn(email, password);
      
      // Get the current session to get user ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Failed to get user session');
      }

      // Check if user has admin role in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, email, full_name')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        console.error('Database error:', userError);
        throw new Error('Failed to verify admin credentials. Please contact support.');
      }

      if (!userData || userData.role !== 'admin') {
        console.log('User data:', userData);
        throw new Error('Access denied. This account does not have admin privileges.');
      }

      // Success - user is authenticated and has admin role
      addNotification(`Welcome back, ${userData.full_name || 'Admin'}!`, 'success');
      onSuccess();
      
    } catch (error: any) {
      console.error('Admin login error:', error);
      addNotification(error.message || 'Failed to sign in', 'error');
      
      // Sign out if there was an error after login
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20">
        <button
          onClick={handleBackToHome}
          className="absolute top-6 left-6 flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="text-center mb-10 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 border border-white/30">
            <Lock className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-white/70 text-sm">Management Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                placeholder="Email address"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                placeholder="Password"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white/20 backdrop-blur-sm text-white py-4 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-white/30 hover:border-white/50"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </div>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={debugAdminUser}
            disabled={debugging}
            className="w-full bg-white/5 backdrop-blur-sm text-white/70 py-3 rounded-xl font-medium hover:bg-white/10 transition-all duration-300 disabled:opacity-50 border border-white/20 text-sm"
          >
            {debugging ? 'Checking Database...' : 'Debug: Check Admin User'}
          </button>
          
          <div className="text-center">
            <p className="text-xs text-white/50 leading-relaxed">
              Authorized access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
