import { ShoppingCart, User, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface HeaderProps {
  onAuthClick: () => void;
  onCartClick: () => void;
  onAdminClick: () => void;
  onProfileClick: () => void;
}

export const Header = ({ onAuthClick, onCartClick, onAdminClick, onProfileClick }: HeaderProps) => {
  const { user, userProfile, isGuest } = useAuth();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-emerald-600">Bhojanalay</div>
            <div className="ml-3 text-xs text-gray-500 hidden sm:block">Cloud Kitchen</div>
          </div>

          <div className="flex items-center space-x-4">
            {userProfile?.role === 'admin' && (
              <button
                onClick={onAdminClick}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                <Shield size={18} />
                <span>Admin Panel</span>
              </button>
            )}

            {(user || isGuest) && (
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

            {user ? (
              <button
                onClick={onProfileClick}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <User size={20} className="text-emerald-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{userProfile?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize">{userProfile?.role}</p>
                  </div>
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
              </button>
            ) : isGuest ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">Guest User</p>
                  <p className="text-xs text-gray-500">Continue shopping</p>
                </div>
                <button
                  onClick={onAuthClick}
                  className="text-sm text-gray-700 hover:text-emerald-600 transition-colors"
                  title="Sign In"
                >
                  Sign In
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
