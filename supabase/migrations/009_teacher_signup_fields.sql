-- Migration: add optional teacher profile fields
-- These columns are nullable so existing rows are unaffected.
-- Run in Supabase SQL Editor or via CLI.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS teacher_code TEXT,
  ADD COLUMN IF NOT EXISTS experience TEXT;
