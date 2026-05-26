-- Migration 012: Enforce one-student-one-batch constraint
-- Safe: de-duplicates first, then adds constraint
-- Reversible: see DROP CONSTRAINT at bottom
-- Business rule: a student belongs to exactly ONE batch

-- ============================================================
-- STEP 1: Identify & fix any existing multi-batch enrollments
-- Keep only the most recent enrollment per student (by enrolled_at)
-- ============================================================
DELETE FROM batch_students
WHERE (batch_id, student_id) NOT IN (
  SELECT DISTINCT ON (student_id) batch_id, student_id
  FROM batch_students
  ORDER BY student_id, enrolled_at DESC
);

-- ============================================================
-- STEP 2: Add UNIQUE constraint on student_id
-- (Idempotent: IF NOT EXISTS via DO block)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'batch_students_student_unique'
      AND conrelid = 'batch_students'::regclass
  ) THEN
    ALTER TABLE batch_students
      ADD CONSTRAINT batch_students_student_unique UNIQUE (student_id);
  END IF;
END $$;

-- ============================================================
-- STEP 3: Also sync users.batch_code for any students whose
-- batch_code doesn't match their actual batch enrollment.
-- This ensures legacy and new system stay consistent.
-- ============================================================
UPDATE users u
SET batch_code = b.code
FROM batch_students bs
JOIN batches b ON b.id = bs.batch_id
WHERE bs.student_id = u.id
  AND u.role = 'student'
  AND (u.batch_code IS DISTINCT FROM b.code);

-- ============================================================
-- VERIFICATION QUERY (run after applying):
-- SELECT student_id, COUNT(*) FROM batch_students
-- GROUP BY student_id HAVING COUNT(*) > 1;
-- Expected: 0 rows
-- ============================================================

-- ============================================================
-- ROLLBACK SCRIPT (run manually if needed):
-- ALTER TABLE batch_students DROP CONSTRAINT IF EXISTS batch_students_student_unique;
-- ============================================================
