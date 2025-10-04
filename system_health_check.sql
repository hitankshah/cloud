-- System Health Check Script
-- Run this in Supabase SQL Editor to verify system readiness

-- 1. Check all required tables exist
SELECT 'TABLES STATUS:' as check_type;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ users table exists'
        ELSE '❌ users table missing'
    END as users_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') 
        THEN '✅ menu_items table exists'
        ELSE '❌ menu_items table missing'
    END as menu_items_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') 
        THEN '✅ orders table exists'
        ELSE '❌ orders table missing'
    END as orders_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') 
        THEN '✅ order_items table exists'
        ELSE '❌ order_items table missing'
    END as order_items_table;

-- 2. Check RLS is enabled
SELECT 'RLS STATUS:' as check_type;
SELECT 
    schemaname, 
    tablename, 
    CASE WHEN rowsecurity THEN '✅ RLS Enabled' ELSE '❌ RLS Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'menu_items', 'orders', 'order_items')
ORDER BY tablename;

-- 3. Check admin user exists
SELECT 'ADMIN USER STATUS:' as check_type;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM users u 
            JOIN auth.users au ON au.id = u.id 
            WHERE u.email = 'admin@bhojanalay.com' AND u.role = 'admin'
        )
        THEN '✅ Admin user exists with admin role'
        WHEN EXISTS (
            SELECT 1 FROM users 
            WHERE email = 'admin@bhojanalay.com'
        )
        THEN '⚠️ User exists but check role'
        ELSE '❌ Admin user does not exist'
    END as admin_status;

-- 4. Show admin user details if exists
SELECT 'ADMIN USER DETAILS:' as check_type;
SELECT 
    u.id, u.email, u.full_name, u.role, u.created_at,
    CASE WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Verified' ELSE '❌ Not Verified' END as email_status
FROM users u 
LEFT JOIN auth.users au ON au.id = u.id 
WHERE u.email = 'admin@bhojanalay.com';

-- 5. Check key RLS policies exist
SELECT 'RLS POLICIES STATUS:' as check_type;
SELECT 
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ Has policies'
        ELSE '⚠️ May need policies'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'menu_items', 'orders', 'order_items')
GROUP BY tablename
ORDER BY tablename;

-- 6. Sample data check
SELECT 'SAMPLE DATA:' as check_type;
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
    (SELECT COUNT(*) FROM menu_items) as menu_items,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM order_items) as order_items;

-- 7. Check for any obvious issues
SELECT 'POTENTIAL ISSUES:' as check_type;
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE role = 'admin') = 0 
        THEN '⚠️ No admin users found'
        ELSE '✅ Admin users exist'
    END as admin_issue,
    CASE 
        WHEN (SELECT COUNT(*) FROM menu_items WHERE is_available = true) = 0 
        THEN '⚠️ No available menu items'
        ELSE '✅ Menu items available'
    END as menu_issue,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'users' 
            AND policyname LIKE '%admin%'
        )
        THEN '⚠️ Admin policies may be missing'
        ELSE '✅ Admin policies found'
    END as policy_issue;

-- 8. Test current user permissions (if running as authenticated user)
SELECT 'CURRENT USER TEST:' as check_type;
SELECT 
    current_setting('request.jwt.claims', true)::json->>'sub' as current_user_id,
    CASE 
        WHEN current_setting('request.jwt.claims', true)::json->>'sub' IS NOT NULL 
        THEN '✅ JWT token present'
        ELSE '⚠️ No JWT token (running as service role?)'
    END as auth_status;

-- 9. Quick functionality test
SELECT 'FUNCTIONALITY TEST:' as check_type;
-- Try to read from each table (this will test RLS policies)
SELECT 
    (SELECT 'users' as table_name, COUNT(*) as accessible_rows FROM users LIMIT 1) 
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items WHERE is_available = true LIMIT 1
UNION ALL  
SELECT 'orders', COUNT(*) FROM orders LIMIT 1
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items LIMIT 1;

-- 10. Summary
SELECT 'SYSTEM SUMMARY:' as check_type;
SELECT 
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') AND
            EXISTS (SELECT 1 FROM users WHERE role = 'admin')
        )
        THEN '🎉 SYSTEM READY - All core components detected'
        ELSE '⚠️ SYSTEM NEEDS SETUP - Check issues above'
    END as system_status;