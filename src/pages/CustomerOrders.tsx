import { useState, useEffect } from 'react';
import { Clock, MapPin, Package, CheckCircle, XCircle, Truck } from 'lucide-react';
import { supabase, Order } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OrderWithDetails extends Order {
  restaurant_name?: string;
  items?: Array<{
    item_name: string;
    quantity: number;
    price: number;
  }>;
}

export const CustomerOrders = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('name')
            .eq('id', order.restaurant_id)
            .single();

          const { data: items } = await supabase
            .from('order_items')
            .select('item_name, quantity, price')
            .eq('order_id', order.id);

          return {
            ...order,
            restaurant_name: restaurant?.name,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={24} />;
      case 'confirmed':
        return <CheckCircle className="text-blue-600" size={24} />;
      case 'preparing':
        return <Package className="text-orange-600" size={24} />;
      case 'out_for_delivery':
        return <Truck className="text-purple-600" size={24} />;
      case 'delivered':
        return <CheckCircle className="text-emerald-600" size={24} />;
      case 'cancelled':
        return <XCircle className="text-red-600" size={24} />;
      default:
        return <Clock className="text-gray-600" size={24} />;
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={80} />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600">Start ordering from your favorite restaurants!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {order.restaurant_name}
                        </h3>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${order.total_amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
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

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-start text-gray-600 text-sm">
                      <MapPin size={16} className="mr-2 flex-shrink-0 mt-1" />
                      <span>{order.delivery_address}</span>
                    </div>
                    {order.special_instructions && (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                        <span className="font-medium">Special Instructions: </span>
                        {order.special_instructions}
                      </div>
                    )}
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
