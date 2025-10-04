-- Admin User Verification Script
-- Run this in your Supabase SQL Editor to check admin user status

-- 1. Check if admin user exists in auth.users
SELECT 'AUTH USERS:' as table_name;
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@bhojanalay.com';

-- 2. Check if admin profile exists in users table
SELECT 'USERS TABLE:' as table_name;
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE email = 'admin@bhojanalay.com';

-- 3. Check all admin users in system
SELECT 'ALL ADMINS:' as table_name;
SELECT id, email, full_name, role, created_at 
FROM users 
WHERE role = 'admin';

-- 4. If user exists in auth but not in users table, create profile:
-- (Only run this if the user exists in auth.users but NOT in users table)
/*
INSERT INTO users (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), 'admin'
FROM auth.users 
WHERE email = 'admin@bhojanalay.com'
AND id NOT IN (SELECT id FROM users WHERE email = 'admin@bhojanalay.com');
*/

-- 5. If user exists but role is wrong, fix it:
-- (Only run this if the user exists but role is 'customer')
/*
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@bhojanalay.com' 
AND role != 'admin';
*/

-- 6. Check RLS policies are working
SELECT 'TESTING RLS:' as table_name;
SELECT current_setting('request.jwt.claims', true)::json->>'sub' as current_user_id;

-- 7. Test admin policy (this should work if you run as admin)
SELECT 'ADMIN TEST:' as table_name;
SELECT COUNT(*) as total_users_visible
FROM users;