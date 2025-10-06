# Admin Panel Security Implementation

## Overview
This document outlines the comprehensive security implementation for the restaurant admin panel, including Zod validation, Helmet security headers, file upload security, and role-based access control.

## Security Features Implemented

### 1. Authentication & Authorization

#### AdminRouteGuard Component (`src/components/AdminRouteGuard.tsx`)
- **Role-based Access Control**: Supports `admin` and `superadmin` roles
- **Route Protection**: Prevents unauthorized access to admin areas
- **Loading States**: Shows appropriate loading indicators during auth checks
- **Access Denied Pages**: Provides clear feedback for insufficient permissions

```tsx
// Usage example
<AdminRouteGuard requiredRole="admin">
  <AdminComponent />
</AdminRouteGuard>
```

#### Admin Permissions Hook
```tsx
const { isAdmin, isSuperAdmin, hasPermission } = useAdminPermissions();
```

### 2. Input Validation with Zod (`src/lib/validations.ts`)

#### File Upload Validation
```typescript
export const fileUploadSchema = z.object({
  file: z.any()
    .refine((file) => file instanceof File, 'Must be a valid file')
    .refine((file) => file?.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file?.type),
      'Only JPEG, PNG, and WebP images are allowed'
    )
});
```

#### Admin Menu Item Validation
```typescript
export const adminMenuItemCreateSchema = z.object({
  name: z.string()
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name too long')
    .regex(/^[a-zA-Z0-9\s\-\&\'\,\.]+$/, 'Item name contains invalid characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description too long'),
  price: z.number()
    .min(0.01, 'Price must be greater than 0')
    .max(999.99, 'Price cannot exceed $999.99'),
  category: z.enum(['morning', 'afternoon', 'dinner']),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false)
});
```

#### Order Management Validation
```typescript
export const orderStatusUpdateSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']),
  adminNotes: z.string().max(200, 'Admin notes too long').optional()
});
```

#### Bulk Operations Validation
```typescript
export const bulkMenuUpdateSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1, 'At least one item must be selected'),
  action: z.enum(['activate', 'deactivate', 'delete']),
  confirmDelete: z.boolean().optional()
}).refine(
  (data) => data.action !== 'delete' || data.confirmDelete === true,
  {
    message: 'Delete confirmation is required for bulk delete operations',
    path: ['confirmDelete']
  }
);
```

### 3. Security Headers with Helmet (`src/lib/security.tsx`)

#### Content Security Policy (CSP)
```typescript
const cspDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https:", "blob:"],
  scriptSrc: ["'self'"],
  connectSrc: ["'self'", supabaseUrl, "https://*.supabase.co"],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  workerSrc: ["'self'", "blob:"],
  childSrc: ["'none'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"]
};
```

#### Admin-Specific Security Headers
```typescript
// In AdminRouteGuard component
<meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta httpEquiv="Pragma" content="no-cache" />
<meta httpEquiv="Expires" content="0" />
```

#### Rate Limiting Implementation
```typescript
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier);
    
    if (!userAttempts || now - userAttempts.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    if (userAttempts.count >= this.maxAttempts) {
      return false;
    }
    
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    return true;
  }
}
```

### 4. File Upload Security (`src/components/ui/FileUpload.tsx`)

#### Secure File Upload Component
- **Client-side Validation**: File type, size, and format validation
- **Secure File Paths**: Timestamped and sanitized file names
- **Progress Tracking**: Visual upload progress with error handling
- **Preview Generation**: Safe image preview with blob URLs

```typescript
const validateFile = (file: File): string | null => {
  try {
    fileUploadSchema.parse({ file, altText: '' });
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'File validation failed';
    }
    return 'Unknown validation error';
  }
};

const generateFilePath = (file: File): string => {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `menu-items/${timestamp}_${sanitizedName}`;
};
```

### 5. Storage Configuration (`src/lib/supabase.ts`)

#### Environment-Based Storage Settings
```typescript
export const STORAGE_CONFIG = {
  bucketName: import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'restaurant-images',
  storageUrl: import.meta.env.VITE_SUPABASE_STORAGE_URL,
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  allowedTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',')
};
```

#### Secure File Upload Functions
```typescript
export const uploadFile = async (file: File, path: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(STORAGE_CONFIG.bucketName)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_CONFIG.bucketName)
    .getPublicUrl(data.path);

  return publicUrl;
};
```

### 6. Environment Variables (.env)

```env
# Supabase Storage Configuration
VITE_SUPABASE_BUCKET_NAME=restaurant-images
VITE_SUPABASE_STORAGE_URL=your-storage-url
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/webp

# Admin Configuration
VITE_ADMIN_EMAIL=admin@restaurant.com
VITE_RATE_LIMIT_MAX_ATTEMPTS=5
VITE_RATE_LIMIT_WINDOW_MS=900000
```

## Security Best Practices Implemented

### 1. **Input Sanitization**
- All user inputs validated with Zod schemas
- SQL injection prevention through Supabase parameterized queries
- XSS prevention through React's built-in escaping

### 2. **Authentication Security**
- Secure session management with Supabase Auth
- Role-based access control with proper validation
- Auto-refresh tokens for session persistence

### 3. **File Upload Security**
- Strict file type validation (whitelist approach)
- File size limits to prevent DoS attacks
- Sanitized file names to prevent path traversal
- Secure storage bucket configuration

### 4. **Admin Panel Security**
- No-cache headers for sensitive admin pages
- Disabled text selection and right-click context menu
- CSP headers to prevent code injection
- Rate limiting to prevent brute force attacks

### 5. **Data Validation**
- Server-side validation for all admin operations
- UUID validation for all database references
- Enum validation for status and category fields
- Bulk operation confirmation requirements

## Usage Examples

### Protecting Admin Routes
```tsx
import { AdminRouteGuard } from '../components/AdminRouteGuard';

export default function ProtectedAdminPanel() {
  return (
    <AdminRouteGuard requiredRole="admin">
      <AdminPanel />
    </AdminRouteGuard>
  );
}
```

### Using File Upload
```tsx
import { FileUpload } from '../components/ui/FileUpload';

<FileUpload
  onUploadComplete={(url, path) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
  }}
  onUploadError={(error) => {
    addNotification('Upload failed: ' + error, 'error');
  }}
/>
```

### Validating Admin Forms
```tsx
import { adminMenuItemCreateSchema } from '../lib/validations';

const validateForm = () => {
  try {
    const validatedData = adminMenuItemCreateSchema.parse(formData);
    return { success: true, data: validatedData };
  } catch (error) {
    return { success: false, errors: error.issues };
  }
};
```

## Security Testing Checklist

- [ ] Role-based access control working correctly
- [ ] File upload restrictions enforced
- [ ] Input validation preventing malicious data
- [ ] Rate limiting preventing brute force attacks
- [ ] CSP headers blocking unauthorized scripts
- [ ] Admin pages not cacheable
- [ ] Proper error handling without information leakage
- [ ] Session management secure and persistent
- [ ] File storage permissions correctly configured
- [ ] Bulk operations require proper confirmation

## Deployment Security

### Production Headers (vercel.json)
```json
{
  "headers": [
    {
      "source": "/admin/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex, nofollow"
        },
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

This comprehensive security implementation ensures that the admin panel is protected against common web vulnerabilities while maintaining a good user experience for authorized administrators.