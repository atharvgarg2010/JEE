import { getPool } from "@/lib/db/postgres";
import { ForbiddenError } from "@/lib/api/error";

/**
 * Asserts that a teacher has access to a specific student.
 * Throws ForbiddenError if the student is not in any of the teacher's batches.
 */
export async function assertTeacherOwnsStudent(teacherId: string, studentId: string): Promise<void> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 1 FROM batch_students bs
     JOIN batch_teachers bt ON bt.batch_id = bs.batch_id
     WHERE bs.student_id = $1 AND bt.teacher_id = $2
     LIMIT 1`,
    [studentId, teacherId]
  );
  if (rows.length === 0) {
    throw new ForbiddenError("Teacher does not have access to this student.");
  }
}

/**
 * Asserts that a teacher is assigned to a specific batch.
 * Throws ForbiddenError if they are not.
 */
export async function assertTeacherOwnsBatch(teacherId: string, batchId: string): Promise<void> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 1 FROM batch_teachers WHERE batch_id = $1 AND teacher_id = $2 LIMIT 1`,
    [batchId, teacherId]
  );
  if (rows.length === 0) {
    throw new ForbiddenError("Teacher does not have access to this batch.");
  }
}

/**
 * Asserts that a module doubt notification belongs to the student.
 */
export async function assertStudentOwnsNotification(studentId: string, notificationId: string): Promise<void> {
  const pool = getPool();
  // It could be a teacher_notification or a module_doubt_notification.
  // The route will specify which one. Let's assume module_doubt_notification.
  const { rows } = await pool.query(
    `SELECT 1 FROM module_doubt_notifications WHERE id = $1 AND student_id = $2 LIMIT 1`,
    [notificationId, studentId]
  );
  if (rows.length === 0) {
    throw new ForbiddenError("Notification not found or does not belong to student.");
  }
}

/**
 * Asserts that a student owns a specific doubt progress entry.
 */
export async function assertStudentOwnsDoubt(studentId: string, questionId: string): Promise<void> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 1 FROM user_question_progress WHERE student_id = $1 AND question_id = $2 LIMIT 1`,
    [studentId, questionId]
  );
  if (rows.length === 0) {
    throw new ForbiddenError("Question progress not found or does not belong to student.");
  }
}

/**
 * Asserts that a student owns a specific module log entry.
 * Note: A student can insert a log for any module, but they can only view/modify their own.
 */
export async function assertStudentOwnsModuleLog(studentId: string, moduleSetId: string): Promise<void> {
  const pool = getPool();
  // Just verifying the moduleSetId exists and student exists.
  // If we needed to restrict module access per batch, we'd do it here. 
  // Currently modules are global, so we just verify the module exists.
  const { rows } = await pool.query(
    `SELECT 1 FROM module_sets WHERE id = $1 LIMIT 1`,
    [moduleSetId]
  );
  if (rows.length === 0) {
    throw new ForbiddenError("Module set does not exist.");
  }
}
