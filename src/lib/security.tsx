import { Helmet, HelmetProvider } from 'react-helmet-async';
import { ReactNode } from 'react';

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  return (
    <HelmetProvider>
      <Helmet>
        {/* Security Headers - Only ones that work with meta tags */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';" />
        
        {/* These headers work with meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        
        {/* Referrer Policy */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Basic meta tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        
        {/* App title and description */}
        <title>Cloud Restaurant - Fresh Food Delivery</title>
        <meta name="description" content="Order fresh, delicious meals from Cloud Restaurant. Fast delivery, great taste!" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Helmet>
      {children}
    </HelmetProvider>
  );
};

// Security utility functions
export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export const validateCSRFToken = (token: string): boolean => {
  // Basic CSRF token validation
  return Boolean(token && token.length >= 32 && /^[a-zA-Z0-9]+$/.test(token));
};

export const generateCSRFToken = (): string => {
  // Generate a random CSRF token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Rate limiting helper (client-side basic implementation)
class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - attempt.timestamp > this.windowMs) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
      return true;
    }
    
    // Check if exceeded limit
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    // Increment count
    attempt.count++;
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Create rate limiter instances
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const signupRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

export { loginRateLimiter, signupRateLimiter };