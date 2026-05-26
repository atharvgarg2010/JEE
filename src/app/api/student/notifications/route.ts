import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { createTeacherNotification } from "@/lib/db/teacher-notifications";
import { notifyTeacherSchema } from "@/lib/validations/attempt";
import { routeDoubtToTeacher } from "@/lib/db/batches";

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

    let routeResult;
    try {
      routeResult = await routeDoubtToTeacher(user.id, parsed.data.questionId);
    } catch (err) {
      return jsonError((err as Error).message || "Question not found", 404);
    }

    const { teacherId, chapterName, batchId } = routeResult;

    const notification = await createTeacherNotification({
      student_id: user.id,
      teacher_id: teacherId,
      question_id: parsed.data.questionId,
      message: parsed.data.message,
      chapter_name: chapterName,
      batch_id: batchId ?? undefined,
    });

    return jsonSuccess({ notification });
  } catch (error) {
    console.error("[student/notifications]", error);
    return jsonError("Failed to send notification", 500);
  }
}

