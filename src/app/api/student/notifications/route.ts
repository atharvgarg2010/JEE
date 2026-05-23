import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { getPool } from "@/lib/db/postgres";
import { createTeacherNotification } from "@/lib/db/teacher-notifications";
import { notifyTeacherSchema } from "@/lib/validations/attempt";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const body = await request.json();
    const parsed = notifyTeacherSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { rows } = await getPool().query(
      `SELECT q.teacher_id, c.name AS chapter_name
       FROM questions q
       JOIN chapters c ON c.id = q.chapter_id
       WHERE q.id = $1`,
      [parsed.data.questionId],
    );

    if (!rows[0]?.teacher_id) {
      return jsonError("Question not found", 404);
    }

    const notification = await createTeacherNotification({
      student_id: user.id,
      teacher_id: rows[0].teacher_id as string,
      question_id: parsed.data.questionId,
      message: parsed.data.message,
      chapter_name: rows[0].chapter_name as string,
    });

    return jsonSuccess({ notification });
  } catch (error) {
    console.error("[student/notifications]", error);
    return jsonError("Failed to send notification", 500);
  }
}
