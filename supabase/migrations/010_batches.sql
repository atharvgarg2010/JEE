-- Phase 1: Batch system foundation tables
-- Safe: purely additive, no existing tables modified
-- Reversible: see DROP statements at the bottom (commented out)

-- ============================================================
-- TABLE: batches
-- Represents a coaching batch (e.g. "Alpha 2026")
-- 'code' mirrors users.batch_code for zero-downtime linking
-- ============================================================
CREATE TABLE IF NOT EXISTS batches (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  code        TEXT        NOT NULL UNIQUE,   -- matches users.batch_code
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_code ON batches (code);
CREATE INDEX IF NOT EXISTS idx_batches_active ON batches (is_active);

ALTER TABLE batches DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: batch_students
-- Many-to-many: students enrolled in batches
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_students (
  batch_id    UUID        NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_students_student ON batch_students (student_id);
CREATE INDEX IF NOT EXISTS idx_batch_students_batch   ON batch_students (batch_id);

ALTER TABLE batch_students DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: batch_teachers
-- Maps a teacher to a batch for a specific subject.
-- UNIQUE (batch_id, subject_id) enforces one teacher per
-- subject per batch — a batch has exactly one Physics teacher,
-- one Chemistry teacher, one Maths teacher.
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_teachers (
  batch_id    UUID        NOT NULL REFERENCES batches(id)  ON DELETE CASCADE,
  teacher_id  UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  subject_id  UUID        NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (batch_id, teacher_id, subject_id),
  -- one teacher per subject per batch
  UNIQUE (batch_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_teachers_teacher ON batch_teachers (teacher_id);
CREATE INDEX IF NOT EXISTS idx_batch_teachers_batch   ON batch_teachers (batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_teachers_subject ON batch_teachers (subject_id);

ALTER TABLE batch_teachers DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: announcements
-- Teacher broadcasts a message to their assigned batch.
-- teacher_id must be a batch_teacher for the given batch.
-- That constraint is enforced at the application layer.
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  batch_id    UUID        NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_batch   ON announcements (batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher ON announcements (teacher_id, created_at DESC);

ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROLLBACK SCRIPT (run manually if needed):
-- DROP TABLE IF EXISTS announcements;
-- DROP TABLE IF EXISTS batch_teachers;
-- DROP TABLE IF EXISTS batch_students;
-- DROP TABLE IF EXISTS batches;
-- ============================================================
