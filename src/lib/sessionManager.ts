  // Session Management Utilities
import { supabase, SUPABASE_CONFIG_ERROR } from './supabase';

/**
 * Check if user has a valid session
 */
export const hasValidSession = async (): Promise<boolean> => {
  try {
    const client = supabase;
    if (!client) {
      console.warn(SUPABASE_CONFIG_ERROR);
      return false;
    }
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      return false;
    }

    return !!session;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

/**
 * Manually refresh the session token
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    const client = supabase;
    if (!client) {
      console.warn(SUPABASE_CONFIG_ERROR);
      return false;
    }
    const { data: { session }, error } = await client.auth.refreshSession();
    
    if (error) {
      console.error('Token refresh error:', error);
      return false;
    }

    console.log('Session refreshed successfully');
    return !!session;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
};

/**
 * Get session expiry time
 */
export const getSessionExpiry = async (): Promise<Date | null> => {
  try {
    const client = supabase;
    if (!client) {
      console.warn(SUPABASE_CONFIG_ERROR);
      return null;
    }
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) return null;

    // Supabase tokens expire in 1 hour by default
    const expiresAt = session.expires_at;
    if (expiresAt) {
      return new Date(expiresAt * 1000);
    }

    return null;
  } catch (error) {
    console.error('Get session expiry error:', error);
    return null;
  }
};

/**
 * Clear all session data
 */
export const clearSession = async (): Promise<void> => {
  try {
    const client = supabase;
    if (!client) {
      console.warn(SUPABASE_CONFIG_ERROR);
      return;
    }
    await client.auth.signOut();
    
    // Clear any additional localStorage items
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('cart');
    
    console.log('Session cleared successfully');
  } catch (error) {
    console.error('Clear session error:', error);
  }
};

/**
 * Setup automatic session refresh
 * Call this once on app init
 */
export const setupAutoRefresh = () => {
  if (!supabase) {
    console.warn(SUPABASE_CONFIG_ERROR);
    return () => undefined;
  }
  // Check session every 5 minutes
  const intervalId = setInterval(async () => {
    const hasSession = await hasValidSession();
    
    if (hasSession) {
      const expiry = await getSessionExpiry();
      
      if (expiry) {
        const now = new Date();
        const timeUntilExpiry = expiry.getTime() - now.getTime();
        
        // Refresh if less than 10 minutes until expiry
        if (timeUntilExpiry < 10 * 60 * 1000) {
          console.log('Session expiring soon, refreshing...');
          await refreshSession();
        }
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Get session info for debugging
 */
export const getSessionInfo = async () => {
  try {
    const client = supabase;
    if (!client) {
      return {
        hasSession: false,
        message: SUPABASE_CONFIG_ERROR
      };
    }
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) {
      return {
        hasSession: false,
        message: 'No active session'
      };
    }

    const expiry = session.expires_at ? new Date(session.expires_at * 1000) : null;
    const now = new Date();
    const timeUntilExpiry = expiry ? expiry.getTime() - now.getTime() : null;

    return {
      hasSession: true,
      email: session.user.email,
      userId: session.user.id,
      expiresAt: expiry?.toLocaleString(),
      timeUntilExpiry: timeUntilExpiry ? Math.floor(timeUntilExpiry / 1000 / 60) + ' minutes' : 'unknown',
      tokenType: session.token_type,
      accessToken: session.access_token ? '***' + session.access_token.slice(-8) : null
    };
  } catch (error) {
    return {
      hasSession: false,
      error: error
    };
  }
};
