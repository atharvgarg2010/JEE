import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonSuccess } from "@/lib/api/response";
import { getLogsForModule, upsertQuestionLog } from "@/lib/db/modules";
import { z } from "zod";
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { assertStudentOwnsModuleLog } from "@/lib/auth/guards";
import { withTimeout } from "@/lib/api/timeout";

export const dynamic = "force-dynamic";

const upsertLogSchema = z.object({
  question_number: z
    .number()
    .int()
    .min(1, "question_number must be >= 1"),
  status: z.enum(["done", "doubt", "revision", "not_done"]),
}).strict();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleSetId: string }> },
) {
  return withApiErrorHandler(async (req) => {
    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const { moduleSetId } = await params;
    await assertStudentOwnsModuleLog(user.id, moduleSetId);
    
    const result = await withTimeout(getLogsForModule(user.id, moduleSetId));
    return jsonSuccess({
      logs: result.logs,
      analytics: result.analytics,
      question_count: result.question_count,
    });
  }, request);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleSetId: string }> },
) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    // Rate limit question toggles to 60 per minute to prevent spam
    rateLimit(req, { limit: 60, windowMs: 60 * 1000, identifier: `student_module_logs:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const { moduleSetId } = await params;
    await assertStudentOwnsModuleLog(user.id, moduleSetId);

    const data = await parseRequestBody(req, upsertLogSchema);

    const log = await withTimeout(upsertQuestionLog(
      user.id,
      moduleSetId,
      data.question_number,
      data.status,
    ));

    if (!log) {
      throw new ValidationError("Invalid question number or module not found");
    }

    return jsonSuccess({ log });
  }, request);
}
