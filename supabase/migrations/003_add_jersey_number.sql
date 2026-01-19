-- Add jersey number field to child_profiles table
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS jersey_number TEXT;
