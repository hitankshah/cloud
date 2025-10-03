import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'customer' | 'restaurant_owner' | 'guest';
  created_at?: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  image_url: string;
  cuisine_type: string;
  is_active: boolean;
  rating: number;
  delivery_time: string;
  created_at: string;
  open_time?: string | null;
  close_time?: string | null;
  is_open?: boolean | null;
  schedule_notes?: string | null;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_available: boolean;
  is_vegetarian: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  restaurant_id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_address: string;
  customer_phone: string;
  special_instructions: string;
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
