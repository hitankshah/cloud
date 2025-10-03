import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'restaurant_owner'>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInAsGuest, adminSignIn } = useAuth();
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminLogin) {
        await adminSignIn(email, password);
      } else if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName, role);
      }
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('customer');
    setError('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsAdminLogin(false);
    resetForm();
  };

  const toggleAdminLogin = () => {
    setIsAdminLogin(!isAdminLogin);
    setIsLogin(false);
    resetForm();
  };

  const handleGuestContinue = async () => {
    setError('');
    setLoading(true);
    try {
      await signInAsGuest(fullName);
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Unable to continue as guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isAdminLogin
                ? 'Admin Login'
                : isLogin
                ? 'Welcome Back'
                : 'Join Our Kitchen'}
            </h2>
            <p className="text-gray-600">
              {isAdminLogin
                ? 'Sign in to manage Cloud Kitchen menus and orders'
                : isLogin
                ? 'Sign in to manage your orders'
                : 'Create an account to place orders'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              {isLogin ? 'Need an account?' : 'Already registered?'}
            </button>
            <button
              type="button"
              onClick={toggleAdminLogin}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              {isAdminLogin ? 'User Login' : 'Admin Login'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isAdminLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
              isAdminLogin
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading
              ? 'Please wait...'
              : isAdminLogin
              ? 'Admin Sign In'
              : isLogin
              ? 'Sign In'
              : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <span className="absolute inset-x-0 top-1/2 border-t border-gray-200" aria-hidden="true"></span>
            <span className="relative block mx-auto w-max px-3 bg-white text-xs font-semibold text-gray-400 uppercase">
              or
            </span>
          </div>
          <button
            type="button"
            onClick={handleGuestContinue}
            disabled={loading}
            className="mt-4 w-full border border-emerald-200 text-emerald-700 bg-emerald-50 py-3 rounded-lg font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            Continue as Guest
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Guests can browse menus and build a cart. Create an account to place delivery orders.
          </p>
        </div>
      </div>
    </div>
  );
};
