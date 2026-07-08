-- Add gallery image columns to hospitals table
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS gallery_image_1 TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS gallery_image_2 TEXT DEFAULT '';
