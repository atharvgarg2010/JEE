import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getPool } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/students/[studentId]
 *
 * Returns basic profile info for a student, gated to teachers
 * who share a batch with that student.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  const { studentId } = await params;

  try {
    const pool = getPool();

    // Fetch student + verify teacher has access via shared batch
    const { rows } = await pool.query<{
      id: string;
      username: string;
      full_name: string | null;
      roll_number: string | null;
      batch_code: string | null;
    }>(
      `SELECT
         u.id,
         u.username,
         u.full_name,
         u.roll_number,
         b.code AS batch_code
       FROM users u
       LEFT JOIN batch_students bs ON bs.student_id = u.id
       LEFT JOIN batches b ON b.id = bs.batch_id
       WHERE u.id = $1
         AND u.role = 'student'
         AND EXISTS (
           SELECT 1 FROM batch_teachers bt
           WHERE bt.batch_id = bs.batch_id
             AND bt.teacher_id = $2
         )
       LIMIT 1`,
      [studentId, user.id],
    );

    if (!rows[0]) {
      return jsonError("Student not found or access denied", 404);
    }

    return jsonSuccess({ student: rows[0] });
  } catch (error) {
    console.error("[teacher/students/[studentId] GET]", error);
    return jsonError("Failed to load student", 500);
  }
}
