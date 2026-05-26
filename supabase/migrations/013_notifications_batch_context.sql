-- Migration 013: Add batch context to teacher_notifications
-- Safe: nullable column add — no existing rows broken
-- Purpose: track which batch a doubt notification originated from

ALTER TABLE teacher_notifications
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_notifications_batch
  ON teacher_notifications (batch_id)
  WHERE batch_id IS NOT NULL;

-- ============================================================
-- ROLLBACK SCRIPT (run manually if needed):
-- ALTER TABLE teacher_notifications DROP COLUMN IF EXISTS batch_id;
-- ============================================================
