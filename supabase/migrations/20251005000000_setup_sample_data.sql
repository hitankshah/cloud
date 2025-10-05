-- Setup admin user after they sign up
-- This should be run after the admin user signs up through Supabase auth

-- Insert admin user profile if not exists
-- This will be handled by the application signup process
-- The admin email (admin@bhojanalay.com) will automatically get admin role

-- Add some sample menu items for testing
INSERT INTO menu_items (name, description, price, image_url, category, is_vegetarian) VALUES
('Masala Dosa', 'Crispy crepe filled with spiced potato filling, served with sambar and chutney', 8.99, 'https://images.pexels.com/photos/5410400/pexels-photo-5410400.jpeg', 'morning', true),
('Idli Sambar', 'Steamed rice cakes served with sambar and coconut chutney', 6.99, 'https://images.pexels.com/photos/12737657/pexels-photo-12737657.jpeg', 'morning', true),
('Chicken Biryani', 'Aromatic basmati rice cooked with tender chicken and exotic spices', 14.99, 'https://images.pexels.com/photos/11175550/pexels-photo-11175550.jpeg', 'afternoon', false),
('Paneer Butter Masala', 'Cottage cheese cubes in rich tomato and butter gravy', 12.99, 'https://images.pexels.com/photos/6249530/pexels-photo-6249530.jpeg', 'afternoon', true),
('Mutton Curry', 'Tender mutton pieces cooked in traditional spicy curry', 16.99, 'https://images.pexels.com/photos/3659862/pexels-photo-3659862.jpeg', 'dinner', false),
('Dal Tadka', 'Yellow lentils tempered with cumin, garlic, and spices', 8.99, 'https://images.pexels.com/photos/5410401/pexels-photo-5410401.jpeg', 'dinner', true)
ON CONFLICT (name) DO NOTHING;