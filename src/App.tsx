import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { RestaurantList } from './pages/RestaurantList';
import { RestaurantDetail } from './pages/RestaurantDetail';
import { Checkout } from './pages/Checkout';
import { CustomerOrders } from './pages/CustomerOrders';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { OrderManagement } from './pages/OrderManagement';
import { Restaurant } from './lib/supabase';

type View = 'restaurants' | 'restaurant-detail' | 'checkout' | 'orders' | 'dashboard' | 'order-management';

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [currentView, setCurrentView] = useState<View>('restaurants');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const { loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setCurrentView('restaurant-detail');
  };

  const handleBackToRestaurants = () => {
    setSelectedRestaurant(null);
    setCurrentView('restaurants');
  };

  const handleCheckout = () => {
    setCurrentView('checkout');
  };

  const handleCheckoutSuccess = () => {
    setCurrentView('orders');
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view as View);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAuthClick={() => setShowAuthModal(true)}
        onCartClick={() => setShowCart(true)}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {currentView === 'restaurants' && (
        <RestaurantList onRestaurantSelect={handleRestaurantSelect} />
      )}

      {currentView === 'restaurant-detail' && selectedRestaurant && (
        <RestaurantDetail
          restaurant={selectedRestaurant}
          onBack={handleBackToRestaurants}
        />
      )}

      {currentView === 'checkout' && (
        <Checkout
          onBack={() => setShowCart(true)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {currentView === 'orders' && profile?.role === 'customer' && (
        <CustomerOrders />
      )}

      {currentView === 'dashboard' && profile?.role === 'restaurant_owner' && (
        <div className="space-y-8">
          <OwnerDashboard />
          <OrderManagement />
        </div>
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
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
