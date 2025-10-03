import { useState, useEffect } from 'react';
import { Store, Package, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { supabase, Restaurant, Order } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeRestaurants: number;
}

export const OwnerDashboard = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeRestaurants: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user?.id);

      setRestaurants(restaurantsData || []);

      const restaurantIds = restaurantsData?.map((r) => r.id) || [];

      if (restaurantIds.length > 0) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .in('restaurant_id', restaurantIds)
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: allOrdersData } = await supabase
          .from('orders')
          .select('*')
          .in('restaurant_id', restaurantIds);

        setRecentOrders(ordersData || []);

        const totalOrders = allOrdersData?.length || 0;
        const pendingOrders =
          allOrdersData?.filter((o) => o.status === 'pending').length || 0;
        const totalRevenue =
          allOrdersData?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
        const activeRestaurants =
          restaurantsData?.filter((r) => r.is_active).length || 0;

        setStats({
          totalOrders,
          pendingOrders,
          totalRevenue,
          activeRestaurants,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const { error } = await supabase.from('restaurants').insert({
        owner_id: user?.id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        address: formData.get('address') as string,
        phone: formData.get('phone') as string,
        cuisine_type: formData.get('cuisine_type') as string,
        image_url: formData.get('image_url') as string,
      });

      if (error) throw error;

      setShowAddRestaurant(false);
      form.reset();
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('Failed to add restaurant');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Restaurant Dashboard</h1>
          <button
            onClick={() => setShowAddRestaurant(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Restaurant</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package className="text-blue-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingOrders}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <TrendingUp className="text-yellow-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <DollarSign className="text-emerald-600" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Restaurants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeRestaurants}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Store className="text-purple-600" size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Restaurants</h2>
            {restaurants.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No restaurants yet</p>
            ) : (
              <div className="space-y-4">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600">{restaurant.cuisine_type}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        restaurant.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {restaurant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${order.total_amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Add Restaurant</h2>
            <form onSubmit={handleAddRestaurant} className="space-y-4">
              <input
                name="name"
                placeholder="Restaurant Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                name="address"
                placeholder="Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                name="phone"
                placeholder="Phone"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                name="cuisine_type"
                placeholder="Cuisine Type"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                name="image_url"
                placeholder="Image URL"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Add Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRestaurant(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
