-- JEE Tracking Platform: custom auth users table
-- Run this in Supabase SQL Editor or via Supabase CLI

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  username TEXT NOT NULL,
  roll_number TEXT,
  batch_code TEXT,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_username_unique UNIQUE (username),
  CONSTRAINT users_roll_number_unique UNIQUE (roll_number)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users (roll_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_users_updated_at();

-- Custom auth uses server-side API; disable RLS so API can read/write users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
