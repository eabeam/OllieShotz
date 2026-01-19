-- Add location field to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS location TEXT;
