-- Teacher Question Management System

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject_id, slug)
);

CREATE TABLE IF NOT EXISTS question_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  supports_difficulty BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE question_type AS ENUM ('mcq', 'integer');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES question_categories(id) ON DELETE RESTRICT,
  difficulty difficulty_level,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT NOT NULL,
  solution TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_teacher ON questions (teacher_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions (subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions (chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions (category_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions (created_at DESC);

CREATE TABLE IF NOT EXISTS question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempts_count INT NOT NULL DEFAULT 1,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  doubt_marked BOOLEAN NOT NULL DEFAULT FALSE,
  viewed_solution BOOLEAN NOT NULL DEFAULT FALSE,
  reattempt_required BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (student_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_student ON question_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question ON question_attempts (question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_attempted ON question_attempts (attempted_at DESC);

-- updated_at trigger for questions
CREATE OR REPLACE FUNCTION set_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS questions_updated_at ON questions;
CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION set_questions_updated_at();

ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts DISABLE ROW LEVEL SECURITY;

-- Seed subjects
INSERT INTO subjects (name, slug) VALUES
  ('Physics', 'physics'),
  ('Chemistry', 'chemistry'),
  ('Mathematics', 'mathematics')
ON CONFLICT (slug) DO NOTHING;

-- Seed chapters
INSERT INTO chapters (subject_id, name, slug, sort_order)
SELECT s.id, c.name, c.slug, c.sort_order
FROM subjects s
CROSS JOIN (VALUES
  ('physics', 'Mechanics', 'mechanics', 1),
  ('physics', 'Electrodynamics', 'electrodynamics', 2),
  ('physics', 'Optics', 'optics', 3),
  ('physics', 'Modern Physics', 'modern-physics', 4),
  ('chemistry', 'Physical Chemistry', 'physical-chemistry', 1),
  ('chemistry', 'Organic Chemistry', 'organic-chemistry', 2),
  ('chemistry', 'Inorganic Chemistry', 'inorganic-chemistry', 3),
  ('mathematics', 'Algebra', 'algebra', 1),
  ('mathematics', 'Calculus', 'calculus', 2),
  ('mathematics', 'Coordinate Geometry', 'coordinate-geometry', 3),
  ('mathematics', 'Trigonometry', 'trigonometry', 4)
) AS c(subject_slug, name, slug, sort_order)
WHERE s.slug = c.subject_slug
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Seed categories
INSERT INTO question_categories (name, slug, supports_difficulty, sort_order) VALUES
  ('Solved Examples', 'solved-examples', FALSE, 1),
  ('DPP', 'dpp', FALSE, 2),
  ('Prabal (JEE Main)', 'prabal-jee-main', FALSE, 3),
  ('Parikshit (JEE Advanced)', 'parikshit-jee-advanced', FALSE, 4),
  ('Topic Wise', 'topic-wise', FALSE, 5),
  ('PW Challengers', 'pw-challengers', FALSE, 6),
  ('Created by Teacher', 'created-by-teacher', TRUE, 7)
ON CONFLICT (slug) DO NOTHING;
