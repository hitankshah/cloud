# 🚀 Cloud Restaurant - Production Setup Guide

## ✅ What's Been Done

### **Code Cleanup:**
- ✅ Removed all unnecessary SQL files (5+ files deleted)
- ✅ Removed `AdminSetup` component (not needed)
- ✅ Created ONE master SQL file: `database_setup.sql`
- ✅ Updated `AdminLogin.tsx` - No hardcoded emails, production-ready
- ✅ Updated `UserManagement.tsx` - Uses secure RPC functions
- ✅ Updated `AuthContext.tsx` - Proper validation with fallbacks

### **Database Functions Created:**
1. `is_admin()` - Check if user is admin (bypasses RLS)
2. `get_user_profile(user_id)` - Get user profile safely
3. `get_all_users()` - Get all users (admin only)
4. `update_user_role(user_id, role)` - Promote/demote users
5. `create_user()` - Helper for user creation

### **Admin Panel Features:**
✅ **User Management (Admin Panel):**
- View all users
- Create new users (email, password, name, phone, role)
- Edit user details
- Delete users
- **Promote users to admin** (Shield button)
- **Demote admins to customer** (Shield button)
- Cannot demote yourself (safety feature)

---

## 📋 Complete Setup Instructions

### **Step 1: Run Database Setup (REQUIRED)**

1. **Copy the SQL to clipboard:**
```powershell
Get-Content "database_setup.sql" | Set-Clipboard
```

2. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/tvphjcrbxuaozznywcsu/sql/new

3. **Paste and Run:**
   - Paste (Ctrl+V)
   - Click **RUN**
   - Wait for success message

**What it does:**
- Fixes RLS infinite recursion
- Creates all necessary security functions
- Sets up proper policies
- Enables admin user management

---

### **Step 2: Create Your First Admin**

You have 2 options:

#### **Option A: Via Supabase Dashboard (Recommended)**

1. **Create Auth User:**
   - Go to: Authentication → Users → Add User
   - Email: `your-admin@yourdomain.com`
   - Password: `YourSecurePassword123!`
   - Click "Create User"
   - **Copy the User ID** (looks like: `11282a96-a6fa-4b8d-b236-812f8fcd7342`)

2. **Add to Users Table:**
   - Go to: SQL Editor → New Query
   - Run this (replace values):
   
   ```sql
   INSERT INTO users (id, email, full_name, phone, role)
   VALUES (
     '11282a96-a6fa-4b8d-b236-812f8fcd7342',  -- Replace with your user ID
     'your-admin@yourdomain.com',              -- Your admin email
     'Your Name',                               -- Your full name
     '+1234567890',                             -- Optional: phone number
     'admin'
   )
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

3. **Verify:**
   ```sql
   SELECT * FROM users WHERE role = 'admin';
   ```

#### **Option B: Use Existing User**

If you already have a user created:

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Update to admin
UPDATE users SET role = 'admin' WHERE id = 'your-user-id-here';
```

---

### **Step 3: Login and Test**

1. **Go to Admin Login:**
   - URL: `http://localhost:5173/admin` (or your deployed URL)

2. **Enter Credentials:**
   - Email: Your admin email
   - Password: Your admin password

3. **Should see:**
   - ✅ "Welcome back, [Your Name]!" message
   - ✅ Redirect to Admin Dashboard
   - ✅ No errors in console

---

## 🎯 How to Use Admin Features

### **Managing Users:**

1. **Navigate to Admin Panel → User Management**

2. **Create New User:**
   - Click "Add User" button
   - Fill in: Email, Name, Phone, Password
   - Select Role: Customer or Admin
   - Click "Create User"

3. **Promote User to Admin:**
   - Find the user in the list
   - Click the **Shield icon** button
   - Confirm the action
   - User is now an admin!

4. **Demote Admin to Customer:**
   - Find the admin user
   - Click the **Shield icon** button
   - Confirm the action
   - Admin is now a customer

5. **Edit User:**
   - Click the **Edit icon**
   - Update name, phone, or role
   - Click "Update User"

6. **Delete User:**
   - Click the **Trash icon**
   - Confirm deletion
   - User removed from system

### **Safety Features:**
- ✅ You cannot demote yourself (prevents lockout)
- ✅ Confirmation dialogs for all critical actions
- ✅ All changes logged in database
- ✅ Secure RPC functions prevent unauthorized access

---

## 🗂️ File Structure

```
cloud/
├── database_setup.sql          ← ONE SQL file (run this!)
├── src/
│   ├── pages/
│   │   └── Admin/
│   │       ├── AdminLogin.tsx       ← Production-ready login
│   │       ├── AdminPanel.tsx       ← Main dashboard
│   │       ├── UserManagement.tsx   ← Manage users/admins
│   │       ├── MenuManagement.tsx   ← Manage menu items
│   │       └── OrderManagement.tsx  ← Manage orders
│   └── contexts/
│       └── AuthContext.tsx          ← Auth with RPC functions
└── PRODUCTION_SETUP.md         ← This file
```

---

## 🔒 Security Features

### **Frontend Security:**
- ✅ No hardcoded credentials
- ✅ Input validation before API calls
- ✅ Role-based component rendering
- ✅ Automatic logout on auth failure

### **Backend Security:**
- ✅ RLS enabled on all tables
- ✅ Security Definer functions for admin checks
- ✅ Cannot promote yourself accidentally
- ✅ All admin actions verified server-side

### **Database Security:**
- ✅ Policies prevent infinite recursion
- ✅ RPC functions bypass RLS safely
- ✅ Role verified on every request
- ✅ CASCADE delete constraints

---

## 🐛 Troubleshooting

### **"infinite recursion detected"**
→ You haven't run `database_setup.sql` yet. See Step 1.

### **"Failed to fetch users"**
→ Check if you're logged in as admin:
```sql
SELECT * FROM users WHERE id = auth.uid();
```

### **Can't promote users**
→ Verify RPC function exists:
```sql
SELECT * FROM pg_proc WHERE proname = 'update_user_role';
```

### **Users not showing**
→ Use RPC function directly:
```sql
SELECT * FROM get_all_users();
```

### **Still having issues?**
1. Check browser console for errors
2. Verify you're logged in: Check DevTools → Application → Cookies
3. Check Supabase logs: Dashboard → Logs
4. Verify admin role: `SELECT role FROM users WHERE id = auth.uid()`

---

## 📊 Database Functions Reference

### **`is_admin()`**
```sql
-- Check if current user is admin
SELECT is_admin();  -- Returns true/false
```

### **`get_user_profile(user_id)`**
```sql
-- Get your own profile
SELECT * FROM get_user_profile(auth.uid());
```

### **`get_all_users()`**
```sql
-- Get all users (admin only)
SELECT * FROM get_all_users();
```

### **`update_user_role(user_id, role)`**
```sql
-- Promote user to admin
SELECT update_user_role('user-id-here', 'admin');

-- Demote admin to customer
SELECT update_user_role('user-id-here', 'customer');
```

---

## ✅ Production Checklist

Before deploying:

- [ ] Run `database_setup.sql` on production database
- [ ] Create at least 2 admin users (backup access)
- [ ] Test all admin features work correctly
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test with non-admin user (should see restricted view)
- [ ] Enable email verification in Supabase settings
- [ ] Set up proper backup strategy
- [ ] Configure environment variables
- [ ] Test password reset flow
- [ ] Enable monitoring/logging
- [ ] Document admin credentials securely

---

## 🎉 You're Ready!

Your system is now production-ready with:
- ✅ Secure admin authentication
- ✅ Full user management from Admin Panel
- ✅ Ability to create/promote/demote admins
- ✅ No hardcoded credentials
- ✅ Proper frontend + backend validation
- ✅ One clean SQL setup file

**Next:** Run `database_setup.sql` and create your first admin!
