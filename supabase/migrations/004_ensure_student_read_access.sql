-- Ensure students can read questions via direct PostgreSQL (RLS off for API layer)
ALTER TABLE IF EXISTS questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS question_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS question_attempts DISABLE ROW LEVEL SECURITY;

-- Grant read access to authenticated role if using Supabase pooler roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT SELECT ON subjects, chapters, question_categories, questions TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON question_attempts TO authenticated;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
