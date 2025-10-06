import { z } from 'zod';

// Auth validation schemas
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(100, 'Email too long'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
});

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
});

export const guestInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
});

// Order validation schemas
export const orderSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(50, 'Customer name too long'),
  customerEmail: z
    .string()
    .email('Invalid email format'),
  customerPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  deliveryAddress: z
    .string()
    .min(10, 'Delivery address must be at least 10 characters')
    .max(200, 'Delivery address too long'),
  specialInstructions: z
    .string()
    .max(500, 'Special instructions too long')
    .optional()
});

// Admin validation schemas
export const adminCreateSchema = z.object({
  email: z
    .string()
    .email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Admin password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Admin password must contain lowercase, uppercase, number, and special character'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name too long')
});

// Menu item validation schemas
export const menuItemSchema = z.object({
  name: z
    .string()
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description too long'),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(999.99, 'Price too high'),
  category: z.enum(['morning', 'afternoon', 'dinner']),
  isAvailable: z.boolean(),
  isVegetarian: z.boolean(),
  imageUrl: z
    .string()
    .url('Invalid image URL')
    .optional()
});

// File upload validation schemas
export const fileUploadSchema = z.object({
  file: z.any()
    .refine((file) => file instanceof File, 'Must be a valid file')
    .refine((file) => file?.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file?.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
  altText: z
    .string()
    .min(3, 'Alt text must be at least 3 characters')
    .max(100, 'Alt text too long')
    .optional()
});

// Admin panel validation schemas
export const adminMenuItemCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name too long')
    .regex(/^[a-zA-Z0-9\s\-\&\'\,\.]+$/, 'Item name contains invalid characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description too long'),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(999.99, 'Price cannot exceed $999.99'),
  category: z.enum(['morning', 'afternoon', 'dinner'], {
    message: 'Category must be morning, afternoon, or dinner'
  }),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  image: fileUploadSchema.optional()
});

export const adminMenuItemUpdateSchema = adminMenuItemCreateSchema.partial().extend({
  id: z.string().uuid('Invalid menu item ID')
});

// Admin order management schemas
export const orderStatusUpdateSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'], {
    message: 'Invalid order status'
  }),
  adminNotes: z
    .string()
    .max(200, 'Admin notes too long')
    .optional()
});

// Admin user management schemas
export const adminUserUpdateSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['customer', 'admin'], {
    message: 'Role must be customer or admin'
  }),
  isActive: z.boolean().optional()
});

// Bulk operations schemas
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

// Type exports for TypeScript
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;