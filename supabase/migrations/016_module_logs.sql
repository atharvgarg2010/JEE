-- Migration 016: Offline Module Question Logging System
-- Purpose: Track student progress on coaching modules/DPPs without displaying question content.
-- This system is SEPARATE from the platform question engine.
-- All timestamps are WITH TIME ZONE for accurate analytics (velocity, trends).

-- ============================================================
-- TABLE: module_sets
-- Admin-created module containers. Extensible: difficulty, target_date,
-- batch_id, teacher_id can be added in future migrations.
-- ============================================================
CREATE TABLE IF NOT EXISTS module_sets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          TEXT        NOT NULL,
  chapter          TEXT        NOT NULL,
  module_name      TEXT        NOT NULL,
  question_count   INTEGER     NOT NULL CHECK (question_count > 0 AND question_count <= 1000),
  created_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common cascade-dropdown queries (subject → chapter → module)
CREATE INDEX IF NOT EXISTS idx_module_sets_subject
  ON module_sets (subject);

CREATE INDEX IF NOT EXISTS idx_module_sets_subject_chapter
  ON module_sets (subject, chapter);

CREATE INDEX IF NOT EXISTS idx_module_sets_created_by
  ON module_sets (created_by);

-- ============================================================
-- TABLE: module_question_logs
-- Per-question status per student. Upsert-driven.
-- Timestamps on every row for analytics: completion velocity, revision trends.
-- ============================================================
CREATE TABLE IF NOT EXISTS module_question_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_set_id    UUID        NOT NULL REFERENCES module_sets(id) ON DELETE CASCADE,
  question_number  INTEGER     NOT NULL,
  status           TEXT        NOT NULL CHECK (status IN ('done', 'doubt', 'revision', 'not_done')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce one row per (student, module, question)
  CONSTRAINT uq_module_question_log
    UNIQUE (student_id, module_set_id, question_number)
);

-- Primary access pattern: fetch all logs for a student in a module
CREATE INDEX IF NOT EXISTS idx_module_question_logs_student_module
  ON module_question_logs (student_id, module_set_id);

-- Secondary: status-based analytics queries
CREATE INDEX IF NOT EXISTS idx_module_question_logs_status
  ON module_question_logs (student_id, module_set_id, status);

-- ============================================================
-- TABLE: module_doubt_notifications
-- Records when a student explicitly requests teacher attention.
-- NOT automatic — student must trigger manually.
-- Duplicate prevention: UNIQUE on (student_id, module_set_id, question_number)
-- where resolved = FALSE is enforced at the application layer via
-- INSERT ... WHERE NOT EXISTS (see notes below).
-- ============================================================
CREATE TABLE IF NOT EXISTS module_doubt_notifications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_set_id    UUID        NOT NULL REFERENCES module_sets(id) ON DELETE CASCADE,
  question_number  INTEGER     NOT NULL,
  status           TEXT        NOT NULL CHECK (status IN ('doubt', 'revision')),
  resolved         BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary access pattern: teacher fetches unresolved, newest first
CREATE INDEX IF NOT EXISTS idx_module_doubt_notifs_resolved_created
  ON module_doubt_notifications (resolved, created_at DESC);

-- Needed for the dedup check at application layer
CREATE INDEX IF NOT EXISTS idx_module_doubt_notifs_student_module_q
  ON module_doubt_notifications (student_id, module_set_id, question_number, resolved);

-- ============================================================
-- Auto-update updated_at via trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_module_sets_updated_at
  BEFORE UPDATE ON module_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_module_question_logs_updated_at
  BEFORE UPDATE ON module_question_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_module_doubt_notifs_updated_at
  BEFORE UPDATE ON module_doubt_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROLLBACK SCRIPT (run manually if needed):
-- DROP TRIGGER IF EXISTS trg_module_doubt_notifs_updated_at ON module_doubt_notifications;
-- DROP TRIGGER IF EXISTS trg_module_question_logs_updated_at ON module_question_logs;
-- DROP TRIGGER IF EXISTS trg_module_sets_updated_at ON module_sets;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS module_doubt_notifications;
-- DROP TABLE IF EXISTS module_question_logs;
-- DROP TABLE IF EXISTS module_sets;
-- ============================================================
