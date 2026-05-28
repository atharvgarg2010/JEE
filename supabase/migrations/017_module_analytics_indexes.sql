-- =====================================================================
-- Migration: 017_module_analytics_indexes.sql
-- Description: Indexes for efficient module analytics queries
-- =====================================================================

-- Speed up aggregation query filtering logs by student and module set
CREATE INDEX IF NOT EXISTS idx_module_question_logs_student_module
  ON module_question_logs (student_id, module_set_id);

-- Speed up sorting by last updated log
CREATE INDEX IF NOT EXISTS idx_module_question_logs_updated_at_desc
  ON module_question_logs (updated_at DESC);

-- Speed up filtering unresolved doubt notifications per student
CREATE INDEX IF NOT EXISTS idx_module_doubt_notifications_student_resolved
  ON module_doubt_notifications (student_id, resolved);
