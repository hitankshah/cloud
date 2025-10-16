import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Storage configuration
export const STORAGE_CONFIG = {
  bucketName: 'restaurant-images', // Hardcoded to match the storage bucket creation script
  storageUrl: import.meta.env.VITE_SUPABASE_STORAGE_URL,
  maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  allowedTypes: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',')
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'supabase.auth.token',
    debug: false
  }
});

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: 'morning' | 'afternoon' | 'dinner';
  is_available: boolean;
  is_vegetarian: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_address: string;
  special_instructions: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  item_name: string;
}

// Admin panel types
export interface AdminFileUpload {
  file: File;
  path: string;
  altText?: string;
}

export interface AdminMenuItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: 'morning' | 'afternoon' | 'dinner';
  isAvailable: boolean;
  isVegetarian: boolean;
  imageUrl?: string;
  image?: File;
  created_at?: string;
  updated_at?: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: OrderItem[];
  customerName: string;
  customerEmail: string;
  adminNotes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  created_at: string;
  last_sign_in?: string;
}

// Storage helper functions
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

export const deleteFile = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(STORAGE_CONFIG.bucketName)
    .remove([path]);

  if (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
};