import { Plus, Leaf } from 'lucide-react';
import { MenuItem } from '../lib/supabase';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: () => void;
}

export const MenuItemCard = ({ item, onAddToCart }: MenuItemCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            {item.is_vegetarian && (
              <Leaf className="text-emerald-600 flex-shrink-0 ml-2" size={18} />
            )}
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">${item.price.toFixed(2)}</span>
            <button
              onClick={onAddToCart}
              disabled={!item.is_available}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
          {!item.is_available && (
            <p className="text-red-600 text-sm mt-2 font-medium">Currently unavailable</p>
          )}
        </div>
        {item.image_url && (
          <div className="w-32 h-32 flex-shrink-0">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};
