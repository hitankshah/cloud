# Production-Ready Bhojanalay Cloud Kitchen System

## Overview
This is a complete, production-level cloud kitchen ordering system with comprehensive admin management capabilities.

## Completed Features

### Frontend Features

#### Customer-Facing Features
- **Menu Browsing**: Filter by time categories (Morning, Afternoon, Dinner)
- **Shopping Cart**: Add/remove items, adjust quantities
- **Order Checkout**: Complete order flow with customer details, delivery address, and special instructions
- **Guest Ordering**: Users can browse and order without creating an account
- **Authenticated Ordering**: Registered users can track their order history
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop devices

#### Admin Panel Features
- **Secure Admin Login**:
  - Dedicated admin login page at `/admin`
  - Modern dark theme with emerald and red accents (no purple)
  - Built-in debugging tools to verify admin user setup
  - Secure authentication with role-based access control

- **Menu Management**:
  - Add new menu items with full details
  - Edit existing items
  - Delete items
  - Toggle item availability
  - **Image Upload Support**:
    - Direct file upload to Supabase Storage
    - Support for JPG, PNG, WebP formats
    - 5MB file size limit
    - Image preview before saving
    - Option to use external image URLs
    - Thumbnail previews in menu list
  - Categorize items by time of day
  - Mark items as vegetarian
  - Price management

- **Order Management**:
  - Real-time order notifications
  - Visual indicators for unread orders (red border + "NEW" badge)
  - Complete customer information display
  - Order status management with 6 states:
    1. Pending (yellow)
    2. Confirmed (blue)
    3. Preparing (orange)
    4. Ready (purple)
    5. Delivered (green)
    6. Cancelled (red)
  - Special instructions display
  - Order timestamp tracking
  - Unread order counter in header

- **User Management**: View and manage registered users

### Technical Implementation

#### Database Structure
- **users**: User profiles with role-based access (customer/admin)
- **menu_items**: Restaurant menu with categories and availability
- **orders**: Customer orders with full tracking
- **order_items**: Line items for each order
- **Storage**: Supabase Storage bucket for menu images

#### Security Features
- **Row Level Security (RLS)**: Enabled on all tables
- **JWT-based Authentication**: Secure token-based auth
- **Role-based Access Control**: Admin-only routes and features
- **Secure Image Upload**: Admin-only upload permissions
- **SQL Injection Protection**: Parameterized queries via Supabase
- **XSS Protection**: React's built-in sanitization

#### Real-time Features
- **Live Order Notifications**: Admin panel updates instantly when new orders arrive
- **Database Subscriptions**: WebSocket-based real-time updates
- **Toast Notifications**: Success/error/info/warning messages throughout the app

#### UI/UX Design
- **Modern Design System**: Clean, professional interface
- **Color Palette**: Emerald green primary, red accents, neutral grays
- **Typography**: Clear hierarchy with readable fonts
- **Spacing System**: Consistent 8px grid
- **Micro-interactions**: Smooth transitions and hover states
- **Loading States**: Proper feedback during async operations
- **Error Handling**: User-friendly error messages

## Setup Instructions

### 1. Database Setup

Run the main migration:
```sql
-- Already applied: supabase/migrations/20251004152412_create_single_restaurant_system.sql
```

### 2. Storage Setup

**IMPORTANT**: Run this SQL in your Supabase SQL Editor:
```bash
# Copy contents of setup_storage.sql and run in Supabase
```

This creates the `menu-images` bucket with proper permissions.

### 3. Create Admin User

1. Sign up through the app or Supabase Auth dashboard
2. Get the user ID from the auth.users table
3. Run this SQL to make them an admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

### 4. Environment Variables

Ensure your `.env` file has:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Using the Admin Panel

### Accessing Admin Panel
1. Click the red "Admin Panel" button in the header (visible only to admins)
2. Or navigate directly to `/admin`
3. Enter admin credentials
4. Use "Debug: Check Admin User" button if login fails

### Managing Menu Items

#### Adding Items with Images:
1. Go to Menu tab
2. Click "Add Item"
3. Fill in details (name, description, price, category, vegetarian)
4. **Upload Image**: Click "Upload Image" button to select from computer
5. OR paste an external image URL
6. Preview the image before saving
7. Click "Add Item"

#### Image Requirements:
- Max size: 5MB
- Formats: JPG, PNG, WebP
- Recommended size: 800x600px or similar
- Images are stored in Supabase Storage

### Managing Orders

#### Order Notifications:
- New orders show with red border
- "NEW" badge on unread orders
- Counter shows unread order count

#### Updating Order Status:
1. Click any status button to update
2. Order automatically marked as read
3. Customer information always visible
4. Special instructions displayed clearly

## API Endpoints

All data access is through Supabase client:
- `supabase.from('menu_items')` - Menu operations
- `supabase.from('orders')` - Order operations
- `supabase.from('users')` - User management
- `supabase.storage.from('menu-images')` - Image storage

## File Structure

```
src/
├── components/
│   ├── AuthModal.tsx           # Login/signup modal
│   ├── CartDrawer.tsx          # Shopping cart sidebar
│   ├── Header.tsx              # Main navigation
│   ├── MenuItemCard.tsx        # Menu item display
│   └── NotificationToast.tsx   # Toast notifications
├── contexts/
│   ├── AuthContext.tsx         # Authentication state
│   ├── CartContext.tsx         # Shopping cart state
│   └── NotificationContext.tsx # Notification system
├── pages/
│   ├── Home.tsx                # Main menu page
│   ├── Checkout.tsx            # Order checkout
│   └── Admin/
│       ├── AdminLogin.tsx      # Admin login page
│       ├── AdminPanel.tsx      # Main admin layout
│       ├── MenuManagement.tsx  # Menu CRUD + Image upload
│       ├── OrderManagement.tsx # Order tracking
│       └── UserManagement.tsx  # User administration
├── lib/
│   └── supabase.ts            # Supabase client config
└── App.tsx                     # Main app routing
```

## Key Features Checklist

✅ Menu browsing with category filters
✅ Shopping cart with real-time updates
✅ Guest and authenticated ordering
✅ Complete checkout flow
✅ Admin authentication with role verification
✅ Menu management (CRUD operations)
✅ **Image upload for menu items**
✅ Real-time order notifications
✅ Order status management (6 states)
✅ Unread order tracking
✅ Customer information display
✅ Special instructions support
✅ User management
✅ Row Level Security on all tables
✅ Responsive design
✅ Toast notification system
✅ Modern, production-ready UI
✅ Dark theme admin panel (no purple)

## Next Steps (Optional Enhancements)

1. **Email Notifications**: Send order confirmations via email
2. **SMS Notifications**: Alert customers of order status changes
3. **Analytics Dashboard**: Track sales, popular items, peak hours
4. **Inventory Management**: Track ingredient stock levels
5. **Payment Integration**: Stripe/PayPal for online payments
6. **Delivery Tracking**: Real-time delivery person location
7. **Customer Reviews**: Rating and review system
8. **Loyalty Program**: Points and rewards system
9. **Promotional Codes**: Discount and coupon system
10. **Multi-restaurant Support**: Expand to multiple locations

## Troubleshooting

### Admin Login Issues
1. Verify admin user exists: Use "Debug: Check Admin User" button
2. Check user role in database: Should be 'admin' not 'customer'
3. Ensure RLS policies are applied
4. Check browser console for errors

### Image Upload Issues
1. Verify storage bucket exists: Check Supabase dashboard
2. Run setup_storage.sql if bucket doesn't exist
3. Check file size (must be < 5MB)
4. Verify file format (JPG, PNG, WebP only)
5. Ensure user has admin role

### Order Notification Issues
1. Check real-time subscriptions are working
2. Verify RLS policies allow admin to read all orders
3. Check browser console for WebSocket errors

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase connection
3. Review RLS policies in Supabase dashboard
4. Check environment variables
5. Ensure migrations are applied

## License

Private project for Bhojanalay Cloud Kitchen
