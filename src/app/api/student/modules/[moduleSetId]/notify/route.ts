import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonSuccess } from "@/lib/api/response";
import { createOrGetModuleDoubtNotification } from "@/lib/db/modules";
import { z } from "zod";
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { assertStudentOwnsModuleLog } from "@/lib/auth/guards";
import { withTimeout } from "@/lib/api/timeout";

export const dynamic = "force-dynamic";

const notifySchema = z.object({
  question_number: z.number().int().min(1),
  status: z.enum(["doubt", "revision"]),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleSetId: string }> },
) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 10, windowMs: 60 * 1000, identifier: `student_module_notify:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const { moduleSetId } = await params;
    await assertStudentOwnsModuleLog(user.id, moduleSetId);

    const data = await parseRequestBody(req, notifySchema);

    const { notification, created } = await withTimeout(createOrGetModuleDoubtNotification({
      student_id: user.id,
      module_set_id: moduleSetId,
      question_number: data.question_number,
      status: data.status,
    }));

    const status = created ? 201 : 200;
    return jsonSuccess({ notification, created }, status);
  }, request);
}
