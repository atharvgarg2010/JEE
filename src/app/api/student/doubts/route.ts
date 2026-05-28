import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonSuccess } from "@/lib/api/response";
import { getDoubtQuestions } from "@/lib/db/student-dashboard";
import { updateProgressFlags } from "@/lib/db/question-attempts";
import { z } from "zod";
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { assertStudentOwnsDoubt } from "@/lib/auth/guards";
import { withTimeout } from "@/lib/api/timeout";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  questionId: z.string().uuid(),
  doubtResolved: z.boolean(),
}).strict();

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const resolved = new URL(req.url).searchParams.get("resolved");
    const resolvedFilter =
      resolved === "true" ? true : resolved === "false" ? false : undefined;

    const questions = await withTimeout(getDoubtQuestions(user.id, resolvedFilter));
    return jsonSuccess({ questions, total: questions.length });
  }, request);
}

export async function PATCH(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 30, windowMs: 60 * 1000, identifier: `student_doubts:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const data = await parseRequestBody(req, patchSchema);
    
    await assertStudentOwnsDoubt(user.id, data.questionId);

    const progress = await withTimeout(updateProgressFlags(
      user.id,
      data.questionId,
      { doubt_resolved: data.doubtResolved },
    ));

    return jsonSuccess({ progress });
  }, request);
}
