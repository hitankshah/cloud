import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, MapPin, Phone } from 'lucide-react';
import { supabase, Restaurant, MenuItem } from '../lib/supabase';
import { MenuItemCard } from '../components/MenuItemCard';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
}

export const RestaurantDetail = ({ restaurant, onBack }: RestaurantDetailProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addToCart } = useCart();
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchMenuItems();
  }, [restaurant.id]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('category');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(menuItems.map((item) => item.category))];
  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    if (!profile) {
      alert('Sign in or continue as a guest to add items to the cart.');
      return;
    }

    const role = profile.role;
    if (role !== 'customer' && role !== 'guest') {
      alert('Only customer accounts can place orders.');
      return;
    }

    if (!user && role !== 'guest') {
      alert('Please sign in to add items to cart');
      return;
    }

    addToCart(item, restaurant.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-80 bg-gradient-to-b from-gray-900 to-gray-700">
        <img
          src={restaurant.image_url || 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'}
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-50"
        />
        <button
          onClick={onBack}
          className="absolute top-6 left-6 bg-white text-gray-900 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <p className="text-lg text-emerald-600 font-medium mb-4">{restaurant.cuisine_type}</p>
              <p className="text-gray-600 mb-6">{restaurant.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <Star className="text-emerald-600 fill-emerald-600" size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{restaurant.rating.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Clock className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{restaurant.delivery_time}</p>
                    <p className="text-sm text-gray-600">Delivery Time</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <Phone className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{restaurant.phone}</p>
                    <p className="text-sm text-gray-600">Contact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start space-x-2 text-gray-600">
            <MapPin size={20} className="flex-shrink-0 mt-1" />
            <p>{restaurant.address}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Menu</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <p className="text-xl text-gray-600">No items in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAddToCart={() => handleAddToCart(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
