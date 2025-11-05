# Multiple Menu Item Images Feature

## Overview
The restaurant management system now supports uploading up to 4 images per menu item. This allows for better visual presentation of dishes.

## Database Changes

### New Table: `menu_item_images`
```sql
CREATE TABLE menu_item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(menu_item_id, image_order)
);
```

**Purpose:**
- Stores multiple images for each menu item
- `image_order` determines the display sequence (0, 1, 2, 3)
- Cascading delete ensures images are removed when a menu item is deleted

### Updates to `menu_items` Table
- `image_url` field is retained as the **primary/thumbnail image**
- This image is displayed in the menu listing
- When a new item is created and images are uploaded, the first image becomes the primary image
- This maintains backward compatibility

## Frontend Features

### Admin Interface (MenuManagement Component)
1. **Multiple Image Upload**
   - Users can select up to 4 images per item
   - File input accepts multiple selections
   - Each image can be individual uploads

2. **Image Validation**
   - File size limit: 5MB per image
   - Supported formats: JPG, PNG
   - Shows count indicator: "Images (Up to 4) - 2/4"

3. **Image Preview Grid**
   - Shows all selected images in a 2x2 or 4-column grid
   - Each preview displays an order number (1-4)
   - Hover over image to reveal delete button (X)
   - Can remove images before submission

4. **Edit Existing Items**
   - Loads all existing images when editing
   - Shows current images as non-editable previews
   - Can add more images if under 4 limit
   - Can remove and add new images

## API Endpoints

### Menu Item Images API

Located in `lib/api.ts`:

```typescript
menuItemImageApi = {
  // Get all images for a menu item (ordered by image_order)
  getMenuItemImages(menuItemId: string): Promise<MenuItemImage[]>

  // Create a new image for a menu item
  createMenuItemImage(image: MenuItemImage): Promise<MenuItemImage>

  // Update an image (e.g., change order)
  updateMenuItemImage(imageId: string, updates: Partial<MenuItemImage>): Promise<MenuItemImage>

  // Delete a specific image
  deleteMenuItemImage(imageId: string): Promise<boolean>

  // Delete all images for a menu item
  deleteAllMenuItemImages(menuItemId: string): Promise<boolean>
}
```

## Database Migration

Run this SQL migration in Supabase:

```sql
-- Located in: supabase/migrations/20251103_add_multiple_images.sql
```

## Implementation Details

### Image Upload Flow

1. **User selects files** → Multiple file input or drag-and-drop
2. **Validation** → Check file size and format
3. **Preview generation** → Show thumbnails before upload
4. **Upload on submit** → All valid images uploaded to storage bucket
5. **Save metadata** → URLs stored in `menu_item_images` table with order

### Storage Structure

Images are uploaded to the `restaurant-images` bucket:
```
restaurant-images/
└── {random_filename}_{timestamp}.{ext}
```

### Primary Image Logic

- When creating a new item with multiple images:
  - First uploaded image → set as `menu_items.image_url` (primary)
  - All images → stored in `menu_item_images` table

- When editing an item:
  - Keep existing primary image unless explicitly changed
  - New images added to `menu_item_images` table

## Frontend Components

### MenuManagement Component
- **Location:** `src/pages/Admin/MenuManagement.tsx` or `src/components/admin/MenuManagement.tsx`
- **State Variables:**
  - `imageFiles[]` - Array of File objects
  - `imagePreviews[]` - Array of preview URLs
- **Methods:**
  - `handleFileChange()` - Validate and process selected files
  - `uploadImage()` - Upload single file to storage
  - `handleSubmit()` - Upload all images and save item

## User Experience

### Adding a New Item
1. Fill in name, description, price, category
2. Click "Choose File" → Select up to 4 images
3. See previews appear as 4-column grid
4. Remove any images using the X button
5. Click "Add Item" → All images upload

### Editing an Item
1. Click "Edit" on existing item
2. Current images load and display
3. Can remove images by clicking X
4. Can add new images if under 4 limit
5. Click "Update Item" → Changes saved

## Testing Checklist

- [ ] Upload 1 image (minimum requirement)
- [ ] Upload 4 images (maximum)
- [ ] Verify image preview displays correctly
- [ ] Test removing images before submit
- [ ] Edit item and add more images
- [ ] Edit item and remove images
- [ ] Verify images appear in storage bucket
- [ ] Verify image URLs stored correctly
- [ ] Test file size validation
- [ ] Test file format validation
- [ ] Verify images display in frontend menu

## Limitations

- Maximum 4 images per item
- Maximum 5MB per image
- Supported formats: JPG, PNG only
- Images must be uploaded before item creation (no lazy loading)

## Future Enhancements

- Drag-and-drop file upload
- Image reordering (drag images to change display order)
- Image cropping before upload
- Image optimization (compression)
- Bulk image upload
- Image carousel on menu items
