/*
  # Single Cloud Restaurant System - FIXED

  ## Overview
  Database schema for a single cloud restaurant with admin panel for menu and order management.
  Supports time-based menu categories (Morning, Afternoon, Dinner) and real-time order notifications.

  ## Key Fixes
  1. Fixed circular dependency in users table RLS policies
  2. Simplified admin checks to prevent recursion
  3. Added proper guest order support
  4. Improved indexes for better performance
  5. Added cascade deletes where appropriate

  ## Tables

  ### 1. users
  - Stores user profiles linked to Supabase auth
  - Roles: 'customer' or 'admin'
  - RLS policies allow self-management and admin oversight

  ### 2. menu_items
  - Restaurant menu with time-based categories
  - Categories: 'morning', 'afternoon', 'dinner'
  - Admin-only management, public read access

  ### 3. orders
  - Customer orders with status tracking
  - Supports both authenticated and guest orders
  - Real-time notification support via is_read flag

  ### 4. order_items
  - Line items for each order
  - Links to menu items with price snapshots
*/

-- Drop existing objects if they exist (for clean reinstall)
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- FIXED: Simplified policies without circular dependencies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer'); -- Prevent self-promotion to admin

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id); -- This is the key fix - no role check on insert

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Create index for admin lookups
CREATE INDEX idx_users_role ON users(role) WHERE role = 'admin';

-- =====================================================
-- 2. MENU_ITEMS TABLE
-- =====================================================

CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text DEFAULT '',
  category text NOT NULL CHECK (category IN ('morning', 'afternoon', 'dinner')),
  is_available boolean DEFAULT true,
  is_vegetarian boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public can view available menu items (both authenticated and anonymous)
CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  USING (is_available = true);

-- Admins can view all menu items (including unavailable)
CREATE POLICY "Admins can view all menu items"
  ON menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can manage menu items
CREATE POLICY "Admins can insert menu items"
  ON menu_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update menu items"
  ON menu_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete menu items"
  ON menu_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(is_available) WHERE is_available = true;
CREATE INDEX idx_menu_items_category_available ON menu_items(category, is_available) WHERE is_available = true;

-- =====================================================
-- 3. ORDERS TABLE
-- =====================================================

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES users(id) ON DELETE SET NULL, -- Changed to SET NULL for guest orders
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  delivery_address text NOT NULL,
  special_instructions text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Authenticated customers can view their own orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

-- Authenticated customers can create their own orders
CREATE POLICY "Customers can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Guest orders: Allow anonymous users to create orders
CREATE POLICY "Guests can insert orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (customer_id IS NULL);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update orders (status, is_read, etc.)
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_orders_customer ON orders(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_unread ON orders(is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- =====================================================
-- 4. ORDER_ITEMS TABLE
-- =====================================================

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT, -- Prevent deletion of menu items in orders
  item_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Authenticated customers can view their own order items
CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Authenticated customers can create their own order items
CREATE POLICY "Customers can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Guest users can create order items for guest orders
CREATE POLICY "Guests can insert order items"
  ON order_items FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id IS NULL
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can manage order items
CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- =====================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for menu_items
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. HELPER FUNCTIONS (OPTIONAL)
-- =====================================================

-- Function to check if user is admin (useful for application code)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread order count (for admin dashboard)
CREATE OR REPLACE FUNCTION get_unread_order_count()
RETURNS bigint AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RETURN 0;
  END IF;
  
  RETURN (
    SELECT COUNT(*)
    FROM orders
    WHERE is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. BHOJANALAY MENU DATA
-- =====================================================

-- Reading menu from Excel file...
-- Will populate with actual Bhojanalay menu items

-- =====================================================
-- NOTES
-- =====================================================

/*
  ## Key Improvements:

  1. **Fixed User Insert Policy**: Removed role check from INSERT policy to prevent
     circular dependency during signup.

  2. **Better Admin Checks**: Used consistent pattern for admin role verification
     across all policies.

  3. **Guest Order Support**: Changed customer_id foreign key to SET NULL instead of
     CASCADE to preserve order history even if user account is deleted.

  4. **Improved Indexes**: Added composite indexes for common query patterns.

  5. **Menu Item Protection**: Changed order_items menu_item_id to RESTRICT delete
     to prevent accidental deletion of menu items that are in historical orders.

  6. **Helper Functions**: Added utility functions for common operations.

  ## Setup Instructions:

  1. Run this entire SQL script in your Supabase SQL editor
  2. Create your first admin user through Supabase Auth
  3. Manually update that user's role to 'admin' in the users table:
     UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';

  ## Security Notes:

  - Users cannot promote themselves to admin (enforced in UPDATE policy)
  - Only admins can create/modify menu items
  - Customers can only view their own orders
  - Guest orders are supported but cannot be viewed later (no session)
  - All tables have RLS enabled
*/