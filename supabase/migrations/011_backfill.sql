-- Phase 1 Backfill: Migrate existing batch_code values to batches and enroll existing students
-- Reversible: see deletion commands at the bottom

-- 1. Create batches for any distinct batch_code found in users
-- Use the batch_code itself as both the name and code
INSERT INTO batches (name, code, description)
SELECT DISTINCT batch_code, batch_code, 'Automatically backfilled from users'
FROM users
WHERE batch_code IS NOT NULL 
  AND batch_code != ''
ON CONFLICT (code) DO NOTHING;

-- 2. Enroll existing students into batch_students based on their batch_code
INSERT INTO batch_students (batch_id, student_id)
SELECT b.id, u.id
FROM users u
JOIN batches b ON u.batch_code = b.code
WHERE u.role = 'student'
ON CONFLICT (batch_id, student_id) DO NOTHING;

-- ============================================================
-- ROLLBACK SCRIPT (run manually if needed):
-- DELETE FROM batch_students;
-- DELETE FROM batches WHERE description = 'Automatically backfilled from users';
-- ============================================================
