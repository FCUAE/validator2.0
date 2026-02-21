-- ValidateIQ Database Schema for Supabase
-- Run this in the Supabase SQL editor

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'teams')),
  scans_this_month INT DEFAULT 0,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scan jobs
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  idea TEXT NOT NULL,
  audience TEXT NOT NULL,
  timeframe INT NOT NULL DEFAULT 30,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'completed', 'failed')),
  progress INT DEFAULT 0,
  current_source TEXT,
  report JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Index for user scan history
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Scans: users can read their own scans, anyone can insert (for anonymous scans)
CREATE POLICY "Users can view own scans"
  ON scans FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create scans"
  ON scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update scans"
  ON scans FOR UPDATE
  USING (true);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to reset monthly scan counts (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_scans()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET scans_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
