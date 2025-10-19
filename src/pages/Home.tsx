import { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Leaf, Clock } from 'lucide-react';
import {
  supabase,
  MenuItem,
  supabaseConfigurationError,
  SUPABASE_CONFIG_ERROR
} from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export const Home = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'morning' | 'afternoon' | 'dinner'>('morning');
  const { addToCart, cart, updateQuantity, removeFromCart } = useCart();
  const { } = useAuth();
  const { addNotification } = useNotification();

  const fetchMenuItems = useCallback(async () => {
    try {
      if (!supabase) {
        throw new Error(supabaseConfigurationError || SUPABASE_CONFIG_ERROR);
      }
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      addNotification('Failed to load menu items', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (!supabase) {
      console.error(supabaseConfigurationError || SUPABASE_CONFIG_ERROR);
      setLoading(false);
      addNotification('Supabase is not configured. Menu data cannot be loaded.', 'error');
      return;
    }
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel('public:menu_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenuItems();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchMenuItems]);

  const filteredItems = menuItems.filter(item => {
    return item.category === selectedCategory || item.category === 'all';
  });

  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
    addNotification(`${item.name} added to cart`, 'success');
  };

  const getCurrentTimeCategory = (): 'morning' | 'afternoon' | 'dinner' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'dinner';
  };

  useEffect(() => {
    setSelectedCategory(getCurrentTimeCategory());
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bhojanalay Kitchen
          </h1>
          <p className="text-xl text-emerald-50">
            Fresh meals prepared daily Order now and enjoy delicious food delivered.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Today's Menu</h2>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock size={20} />
              <span className="text-sm">Current time: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('morning')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedCategory === 'morning'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Morning (5 AM - 12 PM)
            </button>
            <button
              onClick={() => setSelectedCategory('afternoon')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedCategory === 'afternoon'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Afternoon (12 PM - 5 PM)
            </button>
            <button
              onClick={() => setSelectedCategory('dinner')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedCategory === 'dinner'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Dinner (5 PM - 12 AM)
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <p className="text-xl text-gray-600">No menu items available for this time period</p>
            <p className="text-gray-500 mt-2">Check back later or try another category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const quantity = getItemQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {item.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                      {item.is_vegetarian && (
                        <Leaf className="text-emerald-600 flex-shrink-0" size={20} />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-emerald-600">
                        ${item.price.toFixed(2)}
                      </span>
                      {quantity > 0 ? (
                        <div className="flex items-center space-x-3 bg-emerald-50 rounded-lg px-3 py-2">
                          <button
                            onClick={() => addToCart(item)}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Plus size={18} />
                          </button>
                          <span className="font-bold text-emerald-700 w-6 text-center">{quantity}</span>
                          <button
                            onClick={() => {
                              const cartItem = cart.find(ci => ci.id === item.id);
                              if (cartItem && cartItem.quantity > 1) {
                                updateQuantity(item.id, cartItem.quantity - 1);
                              } else {
                                removeFromCart(item.id);
                              }
                            }}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Minus size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                        >
                          <Plus size={18} />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
