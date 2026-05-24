-- Add resolved support to teacher notifications
ALTER TABLE teacher_notifications
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE;
