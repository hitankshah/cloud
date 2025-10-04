# CloudEats - Single Cloud Restaurant System

A complete cloud restaurant ordering and management system with separate customer and admin interfaces.

## Features

### Customer Features
- Browse menu by time-based categories (Morning, Afternoon, Dinner)
- Add items to cart with quantity management
- Secure checkout with delivery address
- Real-time order status tracking
- Toast notifications for all actions

### Admin Features
- **Menu Management**
  - Add/Edit/Delete menu items
  - Organize by time categories (Morning/Afternoon/Dinner)
  - Toggle item availability
  - Set prices, descriptions, images
  - Mark vegetarian items

- **Order Management**
  - Real-time order notifications
  - View all order details
  - Update order status (Pending → Confirmed → Preparing → Ready → Delivered)
  - Mark orders as read/unread
  - Customer contact information
  - Special instructions handling

## Database Schema

### Tables
1. **users** - Customer and admin profiles
2. **menu_items** - Restaurant menu with time categories
3. **orders** - Customer orders with status tracking
4. **order_items** - Individual items in each order

### Security
- Row Level Security (RLS) enabled on all tables
- JWT authentication via Supabase
- Role-based access control (customer/admin)
- Secure data isolation

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT
- **Real-time**: Supabase Realtime for order notifications

## Getting Started

### Prerequisites
- Database is already set up with migrations applied
- Environment variables configured in `.env`

### Admin Access
1. Create an admin user in Supabase:
   ```sql
   -- First create auth user, then update role
   UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';
   ```

2. Sign in with admin credentials
3. Click "Admin Panel" button in header

### Customer Flow
1. Browse menu by time category
2. Add items to cart
3. Sign in or create account
4. Proceed to checkout
5. Track order status

### Admin Flow
1. Sign in with admin credentials
2. Access admin panel from header button
3. Manage menu items by category
4. Monitor and update orders in real-time
5. Receive notifications for new orders

## Key Features

### Time-Based Menu Categories
- **Morning** (5 AM - 12 PM)
- **Afternoon** (12 PM - 5 PM)
- **Dinner** (5 PM - 12 AM)

### Order Status Flow
1. **Pending** - New order received
2. **Confirmed** - Order accepted
3. **Preparing** - Kitchen is preparing
4. **Ready** - Ready for delivery
5. **Delivered** - Order completed
6. **Cancelled** - Order cancelled

### Notification System
- Success notifications (green)
- Error notifications (red)
- Info notifications (blue)
- Warning notifications (yellow)
- Auto-dismiss after 5 seconds

## Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── AuthModal.tsx
│   ├── CartDrawer.tsx
│   ├── Header.tsx
│   ├── MenuItemCard.tsx
│   └── NotificationToast.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── NotificationContext.tsx
├── lib/               # Utilities
│   └── supabase.ts    # Supabase client & types
├── pages/             # Page components
│   ├── Home.tsx       # Customer menu view
│   ├── Checkout.tsx   # Order placement
│   └── Admin/         # Admin panel
│       ├── AdminPanel.tsx
│       ├── MenuManagement.tsx
│       └── OrderManagement.tsx
└── App.tsx            # Main app component
```

## Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Build & Deploy
```bash
npm install
npm run build
npm run preview
```

## Notes
- Single restaurant system (no multi-restaurant support)
- Admin panel accessible only to users with role='admin'
- Real-time order notifications using Supabase subscriptions
- Responsive design for mobile and desktop
