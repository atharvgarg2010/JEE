-- Student practice: revision tracking
ALTER TABLE question_attempts
  ADD COLUMN IF NOT EXISTS saved_for_revision BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_attempts_revision
  ON question_attempts (student_id, saved_for_revision)
  WHERE saved_for_revision = TRUE;

CREATE INDEX IF NOT EXISTS idx_attempts_doubt
  ON question_attempts (student_id, doubt_marked)
  WHERE doubt_marked = TRUE;
