import { useState } from 'react';
import { Menu, X, Package, Utensils, Users, LogOut, Home } from 'lucide-react';
import { MenuManagement } from './MenuManagement';
import { OrderManagement } from './OrderManagement';
import { UserManagement } from './UserManagement';
import { useAuth } from '../../contexts/AuthContext';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'users'>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut, userProfile } = useAuth();

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`bg-gray-900 text-white w-64 min-h-screen p-6 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'orders'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Package size={20} />
            <span className="font-medium">Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'menu'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Utensils size={20} />
            <span className="font-medium">Menu</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Users size={20} />
            <span className="font-medium">Users</span>
          </button>

          <button
            onClick={handleBackToHome}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 border-t border-gray-700 mt-4 pt-4"
          >
            <Home size={20} />
            <span className="font-medium">Back to Website</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Logged in as:</p>
          <p className="font-medium mb-4">{userProfile?.full_name}</p>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <button
          onClick={() => setSidebarOpen(true)}
          className={`md:hidden mb-4 p-2 bg-gray-900 text-white rounded-lg ${sidebarOpen ? 'hidden' : 'block'}`}
        >
          <Menu size={24} />
        </button>

        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'users' && <UserManagement />}
      </main>
    </div>
  );
};
