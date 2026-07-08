-- Add extended fields to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT '';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee INTEGER DEFAULT 0;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT '09:00-17:00';

-- Add extended fields to hospitals table
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150) DEFAULT '';
