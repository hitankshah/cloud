-- Add multiple image support for menu items
-- This migration adds a new table to store multiple images per menu item

-- Create menu_item_images table
CREATE TABLE IF NOT EXISTS menu_item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(menu_item_id, image_order)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_menu_item_images_menu_item_id ON menu_item_images(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_images_order ON menu_item_images(menu_item_id, image_order);

-- Enable RLS
ALTER TABLE menu_item_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view menu item images
CREATE POLICY "Anyone can view menu item images"
  ON menu_item_images FOR SELECT
  USING (true);

-- Admins can insert images
CREATE POLICY "Admins can insert menu item images"
  ON menu_item_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update images
CREATE POLICY "Admins can update menu item images"
  ON menu_item_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can delete images
CREATE POLICY "Admins can delete menu item images"
  ON menu_item_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Optional: Keep image_url in menu_items as primary/thumbnail image
-- This is already in the schema, so no need to add it

-- Verification query
SELECT 
  id,
  menu_item_id,
  image_url,
  image_order,
  created_at
FROM menu_item_images
LIMIT 5;
