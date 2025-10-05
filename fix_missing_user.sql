-- Fix for missing user profile in users table
-- This adds the admin@bhog.com user to the users table

INSERT INTO users (id, email, full_name, phone, role, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
  COALESCE(raw_user_meta_data->>'phone', ''),
  COALESCE(raw_user_meta_data->>'role', 'admin'),
  created_at
FROM auth.users
WHERE email = 'admin@bhog.com'
ON CONFLICT (id) DO UPDATE SET
  role = COALESCE(EXCLUDED.role, users.role),
  full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name);
