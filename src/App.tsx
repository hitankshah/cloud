import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { NotificationToast } from './components/NotificationToast';
import { Home } from './pages/Home';
import { Checkout } from './pages/Checkout';
import { AdminPanel } from './pages/Admin/AdminPanel';
import { AdminLogin } from './pages/Admin/AdminLogin';
import { AdminSetup } from './components/AdminSetup';

type View = 'home' | 'checkout' | 'admin' | 'admin-login' | 'admin-setup';

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const { loading, userProfile } = useAuth();

  // Check if current URL is admin route
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      if (userProfile?.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('admin-login');
      }
    } else if (path === '/admin-setup') {
      setCurrentView('admin-setup');
    }
  }, [userProfile]);

  // Update URL when view changes
  useEffect(() => {
    if (currentView === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else if (currentView === 'home') {
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

  const handleAdminClick = () => {
    if (userProfile?.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('admin-login');
    }
  };

  const handleAdminLoginSuccess = () => {
    setCurrentView('admin');
  };

  // Admin routes
  if (currentView === 'admin-setup') {
    return <AdminSetup />;
  }

  if (currentView === 'admin-login') {
    return <AdminLogin onSuccess={handleAdminLoginSuccess} />;
  }

  if (currentView === 'admin' && userProfile?.role === 'admin') {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAuthClick={() => setShowAuthModal(true)}
        onCartClick={() => setShowCart(true)}
        onAdminClick={handleAdminClick}
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

      <NotificationToast />
    </div>
  );


}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
