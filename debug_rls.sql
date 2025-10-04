-- Supabase RLS Debug and Fix Script
-- Run this in your Supabase SQL Editor to diagnose and fix RLS issues

-- 1. Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'menu_items', 'orders', 'order_items');

-- 2. List all policies on the users table
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 3. Check if users table exists and has the right structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Test RLS policies by checking current user permissions
-- This will show you what the current authenticated user can see
SELECT 
  'Current auth.uid(): ' || COALESCE(auth.uid()::text, 'NULL') as auth_info;

-- 5. If RLS policies are missing, recreate them
-- Only run these if the policies don't exist (check output of query 2 first)

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them fresh)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Recreate policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 6. Grant necessary permissions to authenticated role
GRANT ALL ON users TO authenticated;
GRANT ALL ON menu_items TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;

-- 7. Check if there are any users in the table
SELECT count(*) as user_count FROM users;

-- 8. If you're testing as a specific user, you can check what that user can see:
-- Replace 'your-user-uuid-here' with an actual UUID from auth.users
-- SELECT * FROM users WHERE id = 'your-user-uuid-here';