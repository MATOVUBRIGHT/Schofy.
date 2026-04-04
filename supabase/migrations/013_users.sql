-- =====================================================
-- Migration: 013_users
-- Description: Cloud-first users table
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public registration
CREATE POLICY "Allow public registration" ON users
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public read" ON users
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Allow authenticated update" ON users
  FOR UPDATE TO anon
  USING (true);
