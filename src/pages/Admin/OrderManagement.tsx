import { useState, useEffect } from 'react';
import { Bell, Clock, Package } from 'lucide-react';
import { supabase, Order } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchOrders();
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        addNotification('New order received!', 'info');
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setUnreadCount(data?.filter(o => !o.is_read).length || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, is_read: true })
        .eq('id', id);

      if (error) throw error;
      addNotification('Order status updated', 'success');
      fetchOrders();
    } catch (error: any) {
      addNotification(error.message || 'Failed to update', 'error');
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    { value: 'preparing', label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
    { value: 'ready', label: 'Ready', color: 'bg-purple-100 text-purple-800' },
    { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        {unreadCount > 0 && (
          <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            <Bell size={20} />
            <span className="font-semibold">{unreadCount} New Order{unreadCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <Package className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-xl text-gray-600">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                !order.is_read ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Order #{order.id.substring(0, 8)}</h3>
                  <p className="text-gray-600">{order.customer_name}</p>
                  <p className="text-sm text-gray-500">{order.customer_email} • {order.customer_phone}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">${order.total_amount.toFixed(2)}</p>
                  {!order.is_read && (
                    <span className="inline-block mt-2 bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                      NEW
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Delivery Address:</p>
                <p className="text-sm text-gray-900">{order.delivery_address}</p>
                {order.special_instructions && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Special Instructions:</p>
                    <p className="text-sm text-gray-900">{order.special_instructions}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => updateOrderStatus(order.id, status.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      order.status === status.value
                        ? status.color + ' ring-2 ring-offset-2 ring-gray-400'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
