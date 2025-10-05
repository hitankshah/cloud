import { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, Clock, ShoppingBag, Users, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../contexts/NotificationContext';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalCustomers: number;
  totalMenuItems: number;
  weeklyRevenue: number[];
  popularItems: Array<{ name: string; count: number }>;
  recentOrders: Array<any>;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    totalMenuItems: 0,
    weeklyRevenue: [],
    popularItems: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscription for orders
    const subscription = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEnd = tomorrow.toISOString();

      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', todayStart)
        .lt('created_at', todayEnd);

      if (todayError) throw todayError;

      // Calculate today's stats
      const todayOrdersCount = todayOrders?.length || 0;
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      const pendingCount = todayOrders?.filter(o => o.status === 'pending').length || 0;

      // Fetch total customers
      const { count: customersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      // Fetch total menu items
      const { count: menuCount } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true });

      // Fetch last 7 days revenue for chart
      const weeklyRevenue: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(today);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const { data: dayOrders } = await supabase
          .from('orders')
          .select('total_amount')
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString());

        const dayRevenue = dayOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
        weeklyRevenue.push(dayRevenue);
      }

      // Fetch popular items (from order_items)
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('item_name')
        .limit(1000);

      const itemCounts: { [key: string]: number } = {};
      orderItems?.forEach(item => {
        itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + 1;
      });

      const popularItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        todayOrders: todayOrdersCount,
        todayRevenue,
        pendingOrders: pendingCount,
        totalCustomers: customersCount || 0,
        totalMenuItems: menuCount || 0,
        weeklyRevenue,
        popularItems,
        recentOrders: recentOrders || [],
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-purple-100 text-purple-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const maxRevenue = Math.max(...stats.weeklyRevenue, 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = new Date().getDay();
  const dayLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayIndex = (todayIndex - i + 7) % 7;
    dayLabels.push(days[dayIndex]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Orders */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <ShoppingBag size={24} />
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm font-medium">Today's Orders</p>
              <h3 className="text-3xl font-bold mt-1">{stats.todayOrders}</h3>
            </div>
          </div>
          <div className="flex items-center text-blue-100 text-sm">
            <TrendingUp size={16} className="mr-1" />
            <span>Live updates</span>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm font-medium">Today's Revenue</p>
              <h3 className="text-3xl font-bold mt-1">${stats.todayRevenue.toFixed(2)}</h3>
            </div>
          </div>
          <div className="flex items-center text-emerald-100 text-sm">
            <TrendingUp size={16} className="mr-1" />
            <span>Total earnings</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Clock size={24} />
            </div>
            <div className="text-right">
              <p className="text-orange-100 text-sm font-medium">Pending Orders</p>
              <h3 className="text-3xl font-bold mt-1">{stats.pendingOrders}</h3>
            </div>
          </div>
          <div className="flex items-center text-orange-100 text-sm">
            <Package size={16} className="mr-1" />
            <span>Needs attention</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Users size={24} />
            </div>
            <div className="text-right">
              <p className="text-purple-100 text-sm font-medium">Total Customers</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalCustomers}</h3>
            </div>
          </div>
          <div className="flex items-center text-purple-100 text-sm">
            <TrendingUp size={16} className="mr-1" />
            <span>Registered users</span>
          </div>
        </div>
      </div>

      {/* Charts and Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Revenue Overview (Last 7 Days)</h3>
            <Calendar className="text-gray-400" size={20} />
          </div>
          
          <div className="flex items-end justify-between h-64 space-x-2">
            {stats.weeklyRevenue.map((revenue, index) => {
              const height = (revenue / maxRevenue) * 100;
              const isToday = index === stats.weeklyRevenue.length - 1;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full flex items-end justify-center h-48">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday ? 'bg-gradient-to-t from-red-500 to-red-400' : 'bg-gradient-to-t from-gray-300 to-gray-200'
                      }`}
                      style={{ height: `${height}%` }}
                    >
                      {revenue > 0 && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          ${revenue.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs mt-2 font-medium ${isToday ? 'text-red-600' : 'text-gray-600'}`}>
                    {dayLabels[index]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Popular Items</h3>
          
          {stats.popularItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No order data yet</p>
          ) : (
            <div className="space-y-4">
              {stats.popularItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.count} orders</p>
                    </div>
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / stats.popularItems[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Orders</h3>
        
        {stats.recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm">#{order.id.substring(0, 8)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">${order.total_amount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
