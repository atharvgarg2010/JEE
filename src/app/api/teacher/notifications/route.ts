import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  listTeacherNotifications,
  markNotificationRead,
} from "@/lib/db/teacher-notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return jsonError("Unauthorized", 401);
  }

  try {
    const notifications = await listTeacherNotifications(user.id);
    return jsonSuccess({ notifications });
  } catch (error) {
    console.error("[teacher/notifications GET]", error);
    return jsonError("Failed to load notifications", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return jsonError("Unauthorized", 401);
  }

  try {
    const { notificationId } = await request.json();
    if (!notificationId) return jsonError("notificationId required", 400);

    const ok = await markNotificationRead(notificationId, user.id);
    if (!ok) return jsonError("Notification not found", 404);

    return jsonSuccess({ read: true });
  } catch (error) {
    console.error("[teacher/notifications PATCH]", error);
    return jsonError("Failed to update notification", 500);
  }
}
