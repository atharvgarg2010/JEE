-- scripts/migrations/add-safety-indexes.sql

-- Index to optimize fetching unread notifications for teachers
CREATE INDEX IF NOT EXISTS idx_teacher_notif_unread 
ON teacher_notifications(teacher_id) 
WHERE read = false;

-- Index to quickly check for duplicate unread notifications 
-- (Abuse prevention: duplicate unresolved teacher notifications)
CREATE INDEX IF NOT EXISTS idx_teacher_notif_dup 
ON teacher_notifications(student_id, question_id) 
WHERE read = false;

-- Index for module doubt notifications pending resolution
CREATE INDEX IF NOT EXISTS idx_module_doubt_unresolved
ON module_doubt_notifications(student_id, module_set_id, question_number)
WHERE resolved = false;
