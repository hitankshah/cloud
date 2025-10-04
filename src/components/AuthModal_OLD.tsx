import { useState } from 'react';
import { X, Mail, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmailVerificationViewProps {
  email: string;
  onClose: () => void;
  onResend: () => void;
}

interface PasswordResetViewProps {
  email: string;
  onClose: () => void;
  onBack: () => void;
}

const EmailVerificationView = ({ email, onClose, onResend }: EmailVerificationViewProps) => {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
        <Mail className="text-emerald-600" size={32} />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        We've sent a verification link to:<br />
        <span className="font-semibold text-gray-900">{email}</span>
      </p>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-emerald-800">
            <p className="font-semibold mb-1">Next Steps:</p>
            <ul className="text-emerald-700 space-y-1 text-left">
              <li>• Check your email inbox</li>
              <li>• Click the verification link</li>
              <li>• Return here to sign in</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={onClose}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
        >
          Got it, I'll check my email
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the email?</p>
          <button
            onClick={onResend}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            Resend verification email
          </button>
        </div>

        <div className="text-xs text-gray-500 leading-relaxed">
          If you don't see the email, check your spam folder or try again with a different email address.
        </div>
      </div>
    </div>
  );
};

  );\n};\n\nconst PasswordResetView = ({ email, onClose, onBack }: PasswordResetViewProps) => {\n  return (\n    <div className=\"text-center\">\n      <div className=\"inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6\">\n        <Lock className=\"text-blue-600\" size={32} />\n      </div>\n      \n      <h2 className=\"text-3xl font-bold text-gray-900 mb-2\">Reset Password</h2>\n      <p className=\"text-gray-600 mb-6 leading-relaxed\">\n        We've sent a password reset link to:<br />\n        <span className=\"font-semibold text-gray-900\">{email}</span>\n      </p>\n\n      <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6\">\n        <div className=\"flex items-start space-x-3\">\n          <CheckCircle className=\"text-blue-600 flex-shrink-0 mt-0.5\" size={18} />\n          <div className=\"text-sm text-blue-800\">\n            <p className=\"font-semibold mb-1\">Next Steps:</p>\n            <ul className=\"text-blue-700 space-y-1 text-left\">\n              <li>• Check your email inbox</li>\n              <li>• Click the password reset link</li>\n              <li>• Create your new password</li>\n              <li>• Return here to sign in</li>\n            </ul>\n          </div>\n        </div>\n      </div>\n\n      <div className=\"space-y-4\">\n        <button\n          onClick={onClose}\n          className=\"w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors\"\n        >\n          Got it, I'll check my email\n        </button>\n\n        <button\n          onClick={onBack}\n          className=\"w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 py-2 transition-colors\"\n        >\n          <ArrowLeft size={16} />\n          <span>Back to Sign In</span>\n        </button>\n\n        <div className=\"text-xs text-gray-500 leading-relaxed\">\n          If you don't see the email, check your spam folder. The reset link is valid for 1 hour.\n        </div>\n      </div>\n    </div>\n  );\n};\n\nexport const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isGuestForm, setIsGuestForm] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, continueAsGuest, resendVerification, resetPassword } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isGuestForm) {
        // Validate guest form
        if (!fullName || !phone || !email) {
          setError('All fields are required for guest checkout');
          setLoading(false);
          return;
        }
        // Continue as guest with provided info
        continueAsGuest({ fullName, phone, email });
        onClose();
        resetForm();
      } else if (isLogin) {
        await signIn(email, password);
        onClose();
        resetForm();
      } else {
        if (!phone) {
          setError('Phone number is required');
          setLoading(false);
          return;
        }
        await signUp(email, password, fullName, phone);
        // Show email verification message instead of closing
        setShowVerification(true);
      }
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
    setPhone('');
    setError('');
    setIsGuestForm(false);
    setShowVerification(false);
    setShowPasswordReset(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await resendVerification(email);
      setError('');
      // Could add a success notification here
    } catch (error: any) {
      setError(error.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {showVerification ? (
          <EmailVerificationView 
            email={email} 
            onClose={handleClose} 
            onResend={() => handleResendVerification()}
          />
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isGuestForm ? 'Guest Information' : isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isGuestForm ? 'Please provide your details to continue' : isLogin ? 'Sign in to place orders' : 'Join us today'}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(isGuestForm || !isLogin) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          {(isGuestForm || !isLogin) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (with country code)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., +1 555-123-4567"
                required
              />
            </div>
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
              placeholder="Enter your email address"
              required
            />
          </div>

          {!isGuestForm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your password"
                required={!isGuestForm}
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isGuestForm ? 'Continue as Guest' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {!isGuestForm && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsGuestForm(true)}
              className="text-sm text-gray-700 underline hover:text-gray-900"
            >
              Continue as guest
            </button>
          </div>
        )}

        {isGuestForm ? (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsGuestForm(false);
                resetForm();
              }}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ← Back to login
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
