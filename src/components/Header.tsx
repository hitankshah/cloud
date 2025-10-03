import { ShoppingCart, User, LogOut, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Header = ({ onAuthClick, onCartClick, currentView, onViewChange }: HeaderProps) => {
  const { profile, signOut } = useAuth();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const isAuthenticated = Boolean(profile);
  const isCustomer = profile?.role === 'customer';
  const isOwner = profile?.role === 'restaurant_owner';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => onViewChange('restaurants')}
          >
            <Store className="text-emerald-600" size={32} />
            <div className="ml-2">
              <span className="block text-2xl font-bold text-gray-900">Cloud Kitchen HQ</span>
              <span className="block text-xs uppercase tracking-wide text-emerald-500">Our in-house brands only</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onViewChange('restaurants')}
              className={`font-medium transition-colors ${
                currentView === 'restaurants' || currentView === 'restaurant-detail'
                  ? 'text-emerald-600'
                  : 'text-gray-700 hover:text-emerald-600'
              }`}
            >
              Restaurants
            </button>
            {isCustomer && (
              <button
                onClick={() => onViewChange('orders')}
                className={`font-medium transition-colors ${
                  currentView === 'orders'
                    ? 'text-emerald-600'
                    : 'text-gray-700 hover:text-emerald-600'
                }`}
              >
                My Orders
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onViewChange('dashboard')}
                className={`font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'text-emerald-600'
                    : 'text-gray-700 hover:text-emerald-600'
                }`}
              >
                Dashboard
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onViewChange('admin')}
                className={`font-medium transition-colors ${
                  currentView === 'admin'
                    ? 'text-emerald-600'
                    : 'text-gray-700 hover:text-emerald-600'
                }`}
              >
                Admin Panel
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {(isCustomer || profile?.role === 'guest') && (
              <button
                onClick={onCartClick}
                className="relative p-2 text-gray-700 hover:text-emerald-600 transition-colors"
              >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile?.role?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-gray-700 hover:text-red-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                <User size={20} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
