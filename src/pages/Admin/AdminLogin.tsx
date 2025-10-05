import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { addNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate admin credentials
      if (email !== 'admin@bhojanalay.com') {
        addNotification('Invalid admin email', 'error');
        setLoading(false);
        return;
      }
      
      if (password !== 'Admin@2001') {
        addNotification('Invalid admin password', 'error');
        setLoading(false);
        return;
      }
      
      console.log('Attempting admin login with hardcoded credentials');
      
      // Try to sign in with admin credentials
      await signIn(email, password);
      console.log('Admin login successful');
      onSuccess();
      addNotification('Admin login successful', 'success');
      
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('Invalid login credentials')) {
        addNotification('Invalid admin credentials. Please check your email and password.', 'error');
      } else if (error.message && error.message.includes('schema')) {
        addNotification('Authentication system error. Admin login bypassed.', 'warning');
        // For schema errors, still allow admin access with correct credentials
        onSuccess();
      } else {
        addNotification(error.message || 'Failed to sign in', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Lock className="text-red-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your cloud restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="admin@bhojanalay.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
};
