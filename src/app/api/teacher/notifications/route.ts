import { getCurrentUser } from "@/lib/auth/session";
import { jsonSuccess } from "@/lib/api/response";
import {
  listTeacherNotifications,
  markNotificationRead,
} from "@/lib/db/teacher-notifications";
import { withApiErrorHandler, UnauthorizedError, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  notificationId: z.string().uuid(),
  action: z.enum(["read", "pin"]),
}).strict();

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      throw new UnauthorizedError();
    }

    const notifications = await withTimeout(listTeacherNotifications(user.id));
    if (!Array.isArray(notifications)) {
      throw new Error("Invalid notifications payload");
    }

    return jsonSuccess({ notifications });
  }, request);
}

export async function PATCH(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 30, windowMs: 60 * 1000, identifier: `teacher_notifications_patch:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await getCurrentUser();
    if (!user || user.role !== "teacher") {
      throw new UnauthorizedError();
    }

    const data = await parseRequestBody(req, patchSchema);
    const { notificationId, action } = data;

    if (action === "read") {
      const ok = await withTimeout(markNotificationRead(notificationId, user.id));
      if (!ok) throw new ValidationError("Notification not found");
      return jsonSuccess({ read: true });
    }

    if (action === "pin") {
      throw new ValidationError("Pin action not supported");
    }

    throw new ValidationError("Unknown notification action");
  }, request);
}
