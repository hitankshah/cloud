import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export const AdminSetup = () => {
  const [email, setEmail] = useState('admin@restaurant.com');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('Admin User');
  const [loading, setLoading] = useState(false);
  const { createAdminUser } = useAuth();
  const { addNotification } = useNotification();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createAdminUser(email, password, fullName);
      addNotification('Admin user created successfully!', 'success');
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (error: any) {
      console.error('Admin creation error:', error);
      addNotification(error.message || 'Failed to create admin user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Admin User
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This is a one-time setup to create your first admin user
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleCreateAdmin}>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Admin User'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• This creates a Supabase auth user and a database profile</li>
            <li>• Make sure your RLS policies are properly configured</li>
            <li>• You can run the debug_rls.sql script in Supabase to verify setup</li>
            <li>• After creating, you can sign in at /admin</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;