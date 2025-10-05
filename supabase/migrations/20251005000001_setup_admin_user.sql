-- Ensure admin user has proper role setup
-- This updates any existing admin user to have the correct role

-- Update admin user role if they exist in auth.users but not in users table
INSERT INTO users (id, email, full_name, phone, role)
SELECT 
  auth.users.id,
  auth.users.email,
  COALESCE(auth.users.raw_user_meta_data->>'full_name', 'Admin User'),
  COALESCE(auth.users.raw_user_meta_data->>'phone', ''),
  'admin'
FROM auth.users
WHERE auth.users.email = 'admin@bhojanalay.com'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.users.id
  );

-- Update existing user to have admin role if they have the admin email
UPDATE users 
SET role = 'admin'
WHERE email = 'admin@bhojanalay.com' AND role != 'admin';

-- Verify the admin user setup
SELECT 'Admin user setup verification:' as message;
SELECT 
  u.email,
  u.role,
  u.full_name,
  'Admin user properly configured' as status
FROM users u
WHERE u.email = 'admin@bhojanalay.com'
UNION ALL
SELECT 
  'admin@bhojanalay.com' as email,
  'NOT FOUND' as role,
  'N/A' as full_name,
  'Admin user needs to be created via signup' as status
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@bhojanalay.com');