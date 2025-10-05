/*
  # Single Cloud Restaurant System - Complete Setup

  ## Overview
  Database schema for cloud restaurant with admin panel.
  
  ## Tables
  1. users - User profiles with role-based access
  2. menu_items - Restaurant menu
  3. orders - Customer orders
  4. order_items - Order line items

  ## Security
  - RLS enabled on all tables
  - JWT-based authentication
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Admins can manage all users" ON users;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view available menu items" ON menu_items;
  DROP POLICY IF EXISTS "Admins can view all menu items" ON menu_items;
  DROP POLICY IF EXISTS "Admins can insert menu items" ON menu_items;
  DROP POLICY IF EXISTS "Admins can update menu items" ON menu_items;
  DROP POLICY IF EXISTS "Admins can delete menu items" ON menu_items;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
  DROP POLICY IF EXISTS "Customers can insert own orders" ON orders;
  DROP POLICY IF EXISTS "Guests can insert orders" ON orders;
  DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
  DROP POLICY IF EXISTS "Admins can update orders" ON orders;
  DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Customers can view own order items" ON order_items;
  DROP POLICY IF EXISTS "Customers can insert own order items" ON order_items;
  DROP POLICY IF EXISTS "Guests can insert order items" ON order_items;
  DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
  DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
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

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES users(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  item_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer');

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Menu items policies
CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admins can view all menu items"
  ON menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

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

-- Orders policies
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Guests can insert orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (customer_id IS NULL);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Order items policies
CREATE POLICY "Customers can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can insert own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

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

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO menu_items (name, description, price, image_url, category, is_vegetarian) 
VALUES
('Masala Dosa', 'Crispy rice crepe filled with spiced potato curry', 8.99, 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg', 'morning', true),
('Idli Sambar', 'Steamed rice cakes served with lentil curry', 6.99, 'https://images.pexels.com/photos/14477865/pexels-photo-14477865.jpeg', 'morning', true),
('Poha', 'Flattened rice with vegetables and spices', 5.99, 'https://images.pexels.com/photos/11928992/pexels-photo-11928992.jpeg', 'morning', true),
('Paneer Butter Masala', 'Cottage cheese in rich tomato gravy with rice', 12.99, 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg', 'afternoon', true),
('Chole Bhature', 'Spicy chickpea curry with fried bread', 10.99, 'https://images.pexels.com/photos/6739523/pexels-photo-6739523.jpeg', 'afternoon', true),
('Biryani', 'Aromatic basmati rice with vegetables and spices', 13.99, 'https://images.pexels.com/photos/2360673/pexels-photo-2360673.jpeg', 'dinner', true),
('Dal Tadka', 'Yellow lentils tempered with spices, served with rice', 9.99, 'https://images.pexels.com/photos/6260921/pexels-photo-6260921.jpeg', 'dinner', true),
('Palak Paneer', 'Cottage cheese in spinach gravy with rice', 11.99, 'https://images.pexels.com/photos/12737652/pexels-photo-12737652.jpeg', 'dinner', true)
ON CONFLICT DO NOTHING;
