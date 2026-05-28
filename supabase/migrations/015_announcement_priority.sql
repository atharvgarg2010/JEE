-- Migration 015: Add priority column to announcements
-- Safe: purely additive, no existing data or structure removed
-- Purpose: allow teachers to mark announcement urgency level

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal', 'important', 'urgent'));

CREATE INDEX IF NOT EXISTS idx_announcements_priority
  ON announcements (priority);

-- ============================================================
-- ROLLBACK SCRIPT (run manually if needed):
-- ALTER TABLE announcements DROP COLUMN IF EXISTS priority;
-- DROP INDEX IF EXISTS idx_announcements_priority;
-- ============================================================
