-- Student dashboard: doubt resolution, revision timestamps, teacher notifications

ALTER TABLE student_question_progress
  ADD COLUMN IF NOT EXISTS doubt_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS doubt_marked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revision_saved_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS teacher_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  chapter_name TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher
  ON teacher_notifications (teacher_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_notifications_student
  ON teacher_notifications (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempts_student_date
  ON question_attempts (student_id, attempted_at DESC);

ALTER TABLE teacher_notifications DISABLE ROW LEVEL SECURITY;
