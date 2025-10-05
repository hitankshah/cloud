import { useState } from 'react';
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

type View = 'home' | 'checkout' | 'admin';

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const { loading, isAdmin, user } = useAuth();

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
    // Check for admin email directly
    const userEmail = user?.email;
    console.log("Admin click check:", { userEmail, isAdminFn: isAdmin() });
    
    if (userEmail === 'admin@bhojanalay.com') {
      console.log("Admin email detected, showing admin panel");
      setCurrentView('admin');
    } else {
      console.log("Not admin email, staying on home");
      setCurrentView('home');
    }
  };

  // If trying to access admin panel, verify admin credentials
  if (currentView === 'admin') {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      );
    }
    
    // Special admin access for admin@bhojanalay.com
    if (user?.email === 'admin@bhojanalay.com') {
      console.log("Admin access granted");
      return <AdminPanel />;
    } else {
      console.log("Admin access denied, redirecting to home");
      // Redirect back to home if not admin
      setTimeout(() => setCurrentView('home'), 0);
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-700">You don't have permission to access the admin panel.</p>
          </div>
        </div>
      );
    }
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
