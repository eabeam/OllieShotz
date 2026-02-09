-- OllieShotz PIN Authentication Migration
-- Adds PIN-based quick access for family members

-- Add PIN columns to child_profiles
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS pin_enabled BOOLEAN DEFAULT false;

-- Create table to track PIN sessions (for audit and revocation)
CREATE TABLE IF NOT EXISTS pin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  anon_user_id UUID NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pin_sessions_anon_user_id ON pin_sessions(anon_user_id);
CREATE INDEX IF NOT EXISTS idx_pin_sessions_child_id ON pin_sessions(child_id);

-- Enable RLS on pin_sessions
ALTER TABLE pin_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view and manage PIN sessions for their profiles
CREATE POLICY "Owners can manage PIN sessions"
  ON pin_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM child_profiles
      WHERE id = child_id AND owner_id = auth.uid()
    )
  );

-- Policy: PIN users can view their own session
CREATE POLICY "PIN users can view own session"
  ON pin_sessions FOR SELECT
  USING (anon_user_id = auth.uid());

-- Update the helper function to include PIN session access
CREATE OR REPLACE FUNCTION user_has_child_access(child_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM child_profiles WHERE id = child_uuid AND owner_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user has accepted family membership
  IF EXISTS (
    SELECT 1 FROM family_members
    WHERE child_id = child_uuid
    AND user_id = auth.uid()
    AND status = 'accepted'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user has valid PIN session (anonymous auth)
  IF EXISTS (
    SELECT 1 FROM pin_sessions
    WHERE child_id = child_uuid
    AND anon_user_id = auth.uid()
    AND revoked = false
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is the profile owner (for restricted operations)
CREATE OR REPLACE FUNCTION user_is_child_owner(child_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM child_profiles WHERE id = child_uuid AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is a PIN session user
CREATE OR REPLACE FUNCTION is_pin_session_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pin_sessions
    WHERE anon_user_id = auth.uid()
    AND revoked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for pin_sessions (optional, for live session management)
ALTER PUBLICATION supabase_realtime ADD TABLE pin_sessions;
