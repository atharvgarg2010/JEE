-- Migration 014: Announcement reads tracking
-- Safe: new table only, no existing tables modified
-- Purpose: track which students have read which announcements

CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_student
  ON announcement_reads (student_id, read_at DESC);

ALTER TABLE announcement_reads DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROLLBACK SCRIPT (run manually if needed):
-- DROP TABLE IF EXISTS announcement_reads;
-- ============================================================
