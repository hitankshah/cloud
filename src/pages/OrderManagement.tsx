import { useState, useEffect } from 'react';
import { MapPin, Phone, Package } from 'lucide-react';
import { supabase, Order } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OrderWithDetails extends Order {
  restaurant_name?: string;
  customer_name?: string;
  items?: Array<{
    item_name: string;
    quantity: number;
    price: number;
  }>;
}

interface OrderManagementProps {
  isEmbedded?: boolean;
}

export const OrderManagement = ({ isEmbedded = false }: OrderManagementProps) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('owner_id', user?.id);

      const restaurantIds = restaurantsData?.map((r) => r.id) || [];

      if (restaurantIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('restaurant_id', restaurantIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const restaurant = restaurantsData?.find((r) => r.id === order.restaurant_id);

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', order.customer_id)
            .single();

          const { data: items } = await supabase
            .from('order_items')
            .select('item_name, quantity, price')
            .eq('order_id', order.id);

          return {
            ...order,
            restaurant_name: restaurant?.name,
            customer_name: profile?.full_name,
            items: items || [],
          };
        })
      );

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  if (loading) {
    return (
      <div className={`${isEmbedded ? 'py-12' : 'min-h-screen'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`${isEmbedded ? '' : 'min-h-screen bg-gray-50 py-8'}`}>
      <div className={`${isEmbedded ? '' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8`}>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Order Management</h1>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders
            </button>
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => setFilter(status.value)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === status.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={80} />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Order #{order.id.substring(0, 8)}
                      </h3>
                      <p className="text-gray-600">{order.restaurant_name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-gray-600 text-sm"
                        >
                          <span>
                            {item.item_name} x {item.quantity}
                          </span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
                      <p className="text-gray-900">{order.customer_name}</p>
                      <div className="flex items-center text-gray-600 text-sm mt-1">
                        <Phone size={14} className="mr-1" />
                        {order.customer_phone}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Delivery Address</p>
                      <div className="flex items-start text-gray-600 text-sm">
                        <MapPin size={14} className="mr-1 mt-1 flex-shrink-0" />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>

                  {order.special_instructions && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Special Instructions
                      </p>
                      <p className="text-sm text-blue-800">{order.special_instructions}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => updateOrderStatus(order.id, status.value)}
                          disabled={order.status === status.value}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            order.status === status.value
                              ? status.color
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
