-- Multi-attempt history, progress states, solution view tracking

CREATE TYPE question_status AS ENUM (
  'NOT_STARTED',
  'CORRECT',
  'WRONG',
  'DOUBT',
  'REVISION',
  'MASTERED',
  'REATTEMPT'
);

ALTER TABLE question_attempts
  DROP CONSTRAINT IF EXISTS question_attempts_student_id_question_id_key;

ALTER TABLE question_attempts
  ADD COLUMN IF NOT EXISTS attempt_number INT NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS student_question_progress (
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  status question_status NOT NULL DEFAULT 'NOT_STARTED',
  doubt_marked BOOLEAN NOT NULL DEFAULT FALSE,
  saved_for_revision BOOLEAN NOT NULL DEFAULT FALSE,
  solution_view_count INT NOT NULL DEFAULT 0,
  total_attempts INT NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, question_id)
);

CREATE TABLE IF NOT EXISTS question_solution_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attempt_number_at_view INT,
  view_context TEXT NOT NULL CHECK (
    view_context IN ('before_solve', 'after_wrong', 'after_correct', 'while_reviewing')
  ),
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_student_question_num
  ON question_attempts (student_id, question_id, attempt_number);

CREATE INDEX IF NOT EXISTS idx_progress_student ON student_question_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON student_question_progress (status);
CREATE INDEX IF NOT EXISTS idx_solution_views_student_question
  ON question_solution_views (student_id, question_id);

-- Backfill attempt numbers on legacy single-row attempts
UPDATE question_attempts
SET attempt_number = COALESCE(attempts_count, 1)
WHERE attempt_number IS NULL OR attempt_number < 1;

ALTER TABLE student_question_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_solution_views DISABLE ROW LEVEL SECURITY;
