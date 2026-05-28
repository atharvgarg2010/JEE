import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonSuccess } from "@/lib/api/response";
import { createTeacherNotification } from "@/lib/db/teacher-notifications";
import { notifyTeacherSchema } from "@/lib/validations/attempt";
import { routeDoubtToTeacher } from "@/lib/db/batches";
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 10, windowMs: 60 * 1000, identifier: `student_notifications:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const data = await parseRequestBody(req, notifyTeacherSchema);

    let routeResult;
    try {
      routeResult = await withTimeout(routeDoubtToTeacher(user.id, data.questionId));
    } catch (err) {
      throw new ValidationError((err as Error).message || "Question not found");
    }

    const { teacherId, chapterName, batchId } = routeResult;

    const notification = await withTimeout(createTeacherNotification({
      student_id: user.id,
      teacher_id: teacherId,
      question_id: data.questionId,
      message: data.message,
      chapter_name: chapterName,
      batch_id: batchId ?? undefined,
    }));

    return jsonSuccess({ notification });
  }, request);
}

