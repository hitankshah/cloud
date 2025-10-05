/*
  # Setup Supabase Storage for Menu Item Images

  ## Instructions
  Run this SQL in your Supabase SQL Editor to enable image uploads for menu items.

  ## What this does
  1. Creates a public storage bucket named 'menu-images'
  2. Sets file size limit to 5MB
  3. Restricts file types to common image formats
  4. Configures RLS policies for public viewing and admin-only management
*/

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete menu images" ON storage.objects;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to menu images
CREATE POLICY "Public can view menu images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-images');

-- Allow admins to upload menu images
CREATE POLICY "Admins can upload menu images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admins to update menu images
CREATE POLICY "Admins can update menu images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admins to delete menu images
CREATE POLICY "Admins can delete menu images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
