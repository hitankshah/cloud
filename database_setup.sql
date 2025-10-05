/*
  ============================================================
  CLOUD RESTAURANT - PRODUCTION DATABASE SETUP
  ============================================================
  
  This is the ONLY SQL file you need to run for production.
  
  INSTRUCTIONS:
  1. Go to: Supabase Dashboard → SQL Editor → New Query
  2. Copy and paste this ENTIRE file
  3. Click RUN
  4. Verify success messages
  
  What this does:
  - Fixes RLS infinite recursion errors
  - Creates secure admin check functions
  - Sets up proper RLS policies for all tables
  - Creates admin user management functions
  
  ============================================================
*/

-- ============================================================
-- STEP 1: DROP OLD PROBLEMATIC POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can view all menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;

-- ============================================================
-- STEP 2: CREATE SECURITY DEFINER FUNCTIONS
-- ============================================================

-- Function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile safely
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  role text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.phone, u.role, u.created_at
  FROM users u
  WHERE u.id = user_id
  AND u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new user (admin only)
CREATE OR REPLACE FUNCTION create_user(
  user_email text,
  user_password text,
  user_full_name text,
  user_phone text DEFAULT '',
  user_role text DEFAULT 'customer'
)
RETURNS json AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Validate role
  IF user_role NOT IN ('customer', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be customer or admin.';
  END IF;
  
  -- Create auth user (this requires service_role key in practice)
  -- For now, admins should use Supabase Dashboard or proper admin API
  -- This function documents the expected behavior
  
  RETURN json_build_object(
    'success', true,
    'message', 'User creation initiated. Complete via Supabase Dashboard.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role (promote/demote admin)
CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS json AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('customer', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be customer or admin.';
  END IF;
  
  -- Prevent user from demoting themselves
  IF target_user_id = auth.uid() AND new_role = 'customer' THEN
    RAISE EXCEPTION 'You cannot demote yourself. Ask another admin.';
  END IF;
  
  -- Update the role
  UPDATE users
  SET role = new_role
  WHERE id = target_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'User role updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  role text,
  created_at timestamptz
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.phone, u.role, u.created_at
  FROM users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3: RECREATE RLS POLICIES WITH SECURITY DEFINER FUNCTIONS
-- ============================================================

-- USERS TABLE POLICIES
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (is_admin());

-- MENU_ITEMS TABLE POLICIES
CREATE POLICY "Admins can view all menu items"
  ON menu_items FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert menu items"
  ON menu_items FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update menu items"
  ON menu_items FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete menu items"
  ON menu_items FOR DELETE
  USING (is_admin());

-- ORDERS TABLE POLICIES
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (is_admin());

-- ORDER_ITEMS TABLE POLICIES
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage order items"
  ON order_items FOR ALL
  USING (is_admin());

-- ============================================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO anon;
GRANT EXECUTE ON FUNCTION create_user(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- ============================================================
-- STEP 5: CREATE FIRST ADMIN USER (MANUAL STEP)
-- ============================================================

/*
  TO CREATE YOUR FIRST ADMIN:
  
  1. Go to: Supabase Dashboard → Authentication → Users → Add User
     - Enter email and password
     - Copy the User ID
  
  2. Run this query (replace YOUR-USER-ID with the copied ID):
  
  INSERT INTO users (id, email, full_name, phone, role)
  VALUES (
    'YOUR-USER-ID-HERE',
    'your-admin@yourdomain.com',
    'Admin Name',
    '+1234567890',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
  
  3. Verify:
  SELECT * FROM users WHERE role = 'admin';
  
  After this, you can manage all users (create, delete, promote to admin)
  from the Admin Panel → User Management section.
*/

-- ============================================================
-- SUCCESS! SETUP COMPLETE
-- ============================================================

SELECT '✅ Database setup complete! Next: Create your first admin user.' as status;
