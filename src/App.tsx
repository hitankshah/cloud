import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SecurityProvider } from './lib/security';
import {
  isSupabaseConfigured,
  supabaseConfigurationError,
  SUPABASE_CONFIG_ERROR
} from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { NotificationToast } from './components/NotificationToast';
import { UserProfile } from './components/UserProfile';
import { Home } from './pages/Home';
import { Checkout } from './pages/Checkout';
// Admin panel removed - admin app handled separately
import { setupAutoRefresh } from './lib/sessionManager';

type View = 'home' | 'checkout';

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const { loading, configError, user, isGuest } = useAuth();

  // Setup automatic session refresh
  useEffect(() => {
    const cleanup = setupAutoRefresh();
    return cleanup;
  }, []);

  // Update URL when view changes
  useEffect(() => {
    if (currentView === 'home') {
      window.history.pushState(null, '', '/');
    }
  }, [currentView]);

  if (!isSupabaseConfigured) {
    const message = configError || supabaseConfigurationError || SUPABASE_CONFIG_ERROR;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
        <div className="max-w-xl bg-white shadow-lg rounded-2xl p-10 border border-gray-100">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Configuration Required</h1>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          <div className="text-sm text-gray-500 space-y-2">
            <p>
              Add your Supabase project credentials to the environment variables file
              (e.g. <code>.env.local</code>) and restart the app.
            </p>
            <p>
              Expected keys: <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
              {' '}or <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user && !isGuest) {
      setShowAuthModal(true);
      return;
    }
    setCurrentView('checkout');
  };

  const handleCheckoutSuccess = () => {
    setCurrentView('home');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setShowCart(false);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAuthClick={() => setShowAuthModal(true)}
        onCartClick={() => setShowCart(true)}
        
        onProfileClick={() => setShowProfile(true)}
      />

      {currentView === 'home' && <Home />}

      {currentView === 'checkout' && (
        <Checkout
          onBack={handleBackToHome}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={handleCheckout}
      />

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      <NotificationToast />
    </div>
  );


}

function App() {
  return (
    <SecurityProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </SecurityProvider>
  );
}

export default App;
