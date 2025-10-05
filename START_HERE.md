# 🚀 Bhojanalay Cloud Kitchen - Start Here

## Current Status: ✅ READY TO USE

Your cloud kitchen system is fully built and ready! Here's what you need to do to get started.

---

## 🎯 Step 1: Create Your First Admin User

**You can't log in to the admin panel until you create an admin user.**

### Option A: Use the Admin Setup Page (Recommended)
1. Open your browser and go to: `http://localhost:5173/admin-setup`
2. Fill in the form:
   - **Email**: Choose your admin email (e.g., admin@bhojanalay.com)
   - **Password**: Choose a secure password (minimum 6 characters)
   - **Full Name**: Your name
3. Click **"Create Admin User"**
4. You'll see a success message
5. Now go to `http://localhost:5173/admin` and log in!

### Option B: Use Supabase SQL Editor
```sql
-- First sign up as a normal user through the app, then run this:
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 🏪 Step 2: Access Your Restaurant

### Customer View (Homepage)
- URL: `http://localhost:5173/`
- **What you'll see**: 8 pre-loaded menu items organized by meal time
- **You can**: Browse menu, add to cart, place orders as guest or registered user

### Admin Panel
- URL: `http://localhost:5173/admin`
- **Login with**: The admin credentials you just created
- **You can**: Manage menu items, track orders, manage users, upload images

---

## ✅ What's Already Working

### 1. Customer Features
✅ Browse menu by time category (Morning, Afternoon, Dinner)
✅ Add items to cart
✅ Guest checkout (no account needed)
✅ Registered user checkout
✅ Order placement with delivery details

### 2. Admin Panel Features
✅ **Orders Management**
   - View all orders in real-time
   - Update order status (6 states: Pending → Confirmed → Preparing → Ready → Delivered → Cancelled)
   - See unread order notifications
   - View complete customer details

✅ **Menu Management**
   - Add/Edit/Delete menu items
   - Upload images or use URLs
   - Categorize by meal time
   - Mark items as vegetarian
   - Toggle availability

✅ **User Management**
   - View all registered users
   - Promote users to admin (shield button)
   - Edit user details
   - Delete users
   - Create new users/admins

### 3. Pre-loaded Menu Items
Your database already has 8 sample items:
- **Morning**: Masala Dosa, Idli Sambar, Poha
- **Afternoon**: Paneer Butter Masala, Chole Bhature
- **Dinner**: Biryani, Dal Tadka, Palak Paneer

---

## 📸 Optional: Enable Image Uploads

Currently, image uploads are configured in the code but require a storage bucket:

### Quick Setup:
1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **"New bucket"**
4. Name it: `menu-images`
5. Make it **Public**
6. Go to **Policies** tab
7. Add this SELECT policy:
   ```
   Policy name: Public can view images
   Operation: SELECT
   Target roles: public
   Expression: bucket_id = 'menu-images'
   ```
8. Add INSERT/UPDATE/DELETE policies for authenticated admins (see `setup_storage.sql`)

**Alternative**: Use external image URLs (Pexels, Unsplash, etc.) - No storage bucket needed!

---

## 🧪 Testing Your System

### Test 1: Customer Experience
1. Open `http://localhost:5173/` in incognito mode
2. Browse menu items - they should all display
3. Add items to cart
4. Go to checkout
5. Fill in guest details
6. Place order
7. ✅ You should see success message

### Test 2: Admin Panel
1. Go to `http://localhost:5173/admin`
2. Log in with your admin credentials
3. You should see the order you just placed!
4. Click on **Orders** tab - see the new order with red border (unread)
5. Click on **Menu** tab - see all 8 menu items
6. Try adding a new menu item
7. Go back to homepage - your new item should appear!

### Test 3: User Management
1. In admin panel, go to **Users** tab
2. You should see your admin user
3. Click "Add User" to create another user
4. Set their role to "customer"
5. You can promote them to admin by clicking the shield button

---

## 🔧 Common Issues & Solutions

### "Invalid login credentials" at /admin
**Problem**: No admin user exists yet
**Solution**: Follow Step 1 above to create admin user

### Menu items don't show on homepage
**Problem**: Items marked as unavailable
**Solution**: In admin panel → Menu → Toggle availability to "Available"

### Can't upload images
**Problem**: Storage bucket not set up
**Solution**: Either set up storage bucket (see above) OR use external image URLs

### Orders don't appear in admin panel
**Problem**: Not logged in as admin
**Solution**: Verify your user has role = 'admin' in database

---

## 🎨 Customizing Your Restaurant

### 1. Replace Sample Menu
1. Log in to admin panel
2. Go to Menu tab
3. Delete sample items you don't need
4. Click "Add Item" to add your real menu
5. Upload photos of your actual dishes

### 2. Customize Branding
Edit these files:
- `src/components/Header.tsx` - Change "Bhojanalay" to your restaurant name
- `index.html` - Update page title
- `src/index.css` - Modify colors (currently uses emerald/red theme)

### 3. Add More Features
The system is ready for:
- Payment integration (Stripe)
- Email notifications
- SMS alerts
- Delivery tracking
- Customer reviews
- Analytics dashboard

---

## 📁 Important Files

- **Database Migration**: `supabase/migrations/create_restaurant_system_fixed.sql` (already applied)
- **Storage Setup**: `setup_storage.sql` (run this for image uploads)
- **Testing Guide**: `COMPLETE_SYSTEM_TEST.md`
- **Feature Docs**: `PRODUCTION_READY_FEATURES.md`
- **Environment**: `.env` (already configured)

---

## 🚨 Security Notes

✅ All tables have Row Level Security (RLS) enabled
✅ JWT-based authentication via Supabase
✅ Admins can only be created by other admins
✅ Customers can only see their own orders
✅ Menu items are publicly readable
✅ Only admins can modify menu/orders/users

---

## 💡 Quick Reference URLs

| Feature | URL | Access Level |
|---------|-----|--------------|
| Homepage | `http://localhost:5173/` | Everyone |
| Admin Setup | `http://localhost:5173/admin-setup` | First-time setup |
| Admin Login | `http://localhost:5173/admin` | Admins only |
| Supabase Dashboard | Check your `.env` file | You |

---

## 🎓 Learn More

- **Admin Panel**: Has 3 tabs - Orders, Menu, Users
- **Real-time Orders**: Orders appear instantly in admin panel
- **Status Workflow**: Pending → Confirmed → Preparing → Ready → Delivered
- **Guest Orders**: Customers can order without creating account
- **Image Support**: Upload files or use URLs

---

## ✨ Next Steps

1. ✅ Create admin user (Step 1 above)
2. ✅ Test the system (open homepage + admin panel)
3. ✅ Customize menu with your items
4. ✅ Upload your restaurant photos
5. ✅ Start taking real orders!

**Need help?** Check `COMPLETE_SYSTEM_TEST.md` for detailed testing guide.

---

## 🎉 You're All Set!

Your cloud kitchen system is production-ready. Create that admin user and start managing your restaurant!
