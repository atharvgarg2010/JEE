-- Add pinned support to teacher notifications
ALTER TABLE teacher_notifications
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
