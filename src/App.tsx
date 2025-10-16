import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SecurityProvider } from './lib/security';
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
  const { loading } = useAuth();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  const handleCheckout = () => {
    setCurrentView('checkout');
  };

  const handleCheckoutSuccess = () => {
    setCurrentView('home');
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
          onBack={() => setShowCart(true)}
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
