import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonSuccess } from "@/lib/api/response";
import { resolveModuleDoubtNotification } from "@/lib/db/modules";
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notifId: string }> },
) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 30, windowMs: 60 * 1000, identifier: `teacher_module_doubts:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireTeacher();
    if (!isTeacherUser(user)) return user;

    const { notifId } = await params;
    const success = await withTimeout(resolveModuleDoubtNotification(notifId, user.id));

    if (!success) {
      throw new ValidationError("Notification not found or you do not have access");
    }

    return jsonSuccess({ resolved: true });
  }, request);
}
