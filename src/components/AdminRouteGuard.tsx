import React, { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { SecurityProvider } from '../lib/security';

interface AdminRouteGuardProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'superadmin';
}

export function AdminRouteGuard({ children, requiredRole = 'admin' }: AdminRouteGuardProps) {
  const { user, loading } = useAuth();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-blue-500 mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">
            Please log in with admin credentials to access this area.
          </p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (user.role !== requiredRole && user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-red-500 mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this area.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <SecurityProvider>
      <Helmet>
        <title>Admin Panel - Restaurant Management</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Restaurant admin panel for managing orders, menu, and users" />
        
        {/* Admin-specific security headers */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Prevent embedding in frames */}
        <style type="text/css">
          {`
            body { 
              -webkit-user-select: none; 
              -moz-user-select: none; 
              -ms-user-select: none; 
              user-select: none;
            }
            /* Disable right-click context menu on admin pages */
            .admin-content {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
            }
          `}
        </style>
      </Helmet>
      
      <div className="admin-content">
        {children}
      </div>
    </SecurityProvider>
  );
}

// Higher-order component for admin route protection
export function withAdminAuth<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  requiredRole: 'admin' | 'superadmin' = 'admin'
) {
  const AdminProtectedComponent = (props: T) => {
    return (
      <AdminRouteGuard requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </AdminRouteGuard>
    );
  };

  AdminProtectedComponent.displayName = `withAdminAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AdminProtectedComponent;
}

// Hook for checking admin permissions within components
export function useAdminPermissions() {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  
  const hasPermission = (requiredRole: 'admin' | 'superadmin' = 'admin') => {
    if (requiredRole === 'admin') {
      return isAdmin;
    }
    return isSuperAdmin;
  };
  
  return {
    isAdmin,
    isSuperAdmin,
    hasPermission,
    user
  };
}