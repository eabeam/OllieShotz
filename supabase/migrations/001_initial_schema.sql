-- OllieShotz Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Child profiles (one per account owner, shared with family)
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  team_name TEXT,
  primary_color TEXT DEFAULT '#1e40af',
  secondary_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Family sharing (who has access to a child)
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(child_id, email)
);

-- Games
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL,
  game_date DATE NOT NULL,
  opponent TEXT NOT NULL,
  periods JSONB DEFAULT '["P1","P2","P3"]'::jsonb,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shot events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('save', 'goal')),
  period TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  synced BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX idx_games_child_id ON games(child_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_events_game_id ON events(game_id);
CREATE INDEX idx_family_members_email ON family_members(email);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);

-- Enable Row Level Security
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has access to a child profile
CREATE OR REPLACE FUNCTION user_has_child_access(child_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM child_profiles WHERE id = child_uuid AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM family_members
    WHERE child_id = child_uuid
    AND user_id = auth.uid()
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Child Profiles Policies
CREATE POLICY "Users can view their own child profiles"
  ON child_profiles FOR SELECT
  USING (owner_id = auth.uid() OR user_has_child_access(id));

CREATE POLICY "Users can create their own child profiles"
  ON child_profiles FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own child profiles"
  ON child_profiles FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own child profiles"
  ON child_profiles FOR DELETE
  USING (owner_id = auth.uid());

-- Family Members Policies
CREATE POLICY "Owners can manage family members"
  ON family_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM child_profiles
      WHERE id = child_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own family membership"
  ON family_members FOR SELECT
  USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own family membership"
  ON family_members FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Games Policies
CREATE POLICY "Users can view games they have access to"
  ON games FOR SELECT
  USING (user_has_child_access(child_id));

CREATE POLICY "Users can create games for profiles they have access to"
  ON games FOR INSERT
  WITH CHECK (user_has_child_access(child_id));

CREATE POLICY "Users can update games for profiles they have access to"
  ON games FOR UPDATE
  USING (user_has_child_access(child_id))
  WITH CHECK (user_has_child_access(child_id));

CREATE POLICY "Users can delete games for profiles they own"
  ON games FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM child_profiles
      WHERE id = child_id AND owner_id = auth.uid()
    )
  );

-- Events Policies
CREATE POLICY "Users can view events for games they have access to"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_id AND user_has_child_access(g.child_id)
    )
  );

CREATE POLICY "Users can create events for games they have access to"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_id AND user_has_child_access(g.child_id)
    )
  );

CREATE POLICY "Users can delete events for games they have access to"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_id AND user_has_child_access(g.child_id)
    )
  );

-- Enable realtime for events table (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for games updated_at
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
