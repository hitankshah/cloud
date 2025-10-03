import { Star, Clock, Leaf } from 'lucide-react';
import { Restaurant } from '../lib/supabase';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export const RestaurantCard = ({ restaurant, onClick }: RestaurantCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-emerald-200"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={restaurant.image_url || 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'}
          alt={restaurant.name}
          className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full shadow-md">
          <div className="flex items-center space-x-1">
            <Star className="text-yellow-500 fill-yellow-500" size={16} />
            <span className="font-semibold text-sm">{restaurant.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{restaurant.name}</h3>
        <p className="text-emerald-600 text-sm font-medium mb-2">{restaurant.cuisine_type}</p>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Clock size={16} className="mr-1" />
            <span>{restaurant.delivery_time}</span>
          </div>
          {restaurant.cuisine_type.toLowerCase().includes('veg') && (
            <div className="flex items-center text-emerald-600">
              <Leaf size={16} className="mr-1" />
              <span className="text-xs font-medium">Vegetarian</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
