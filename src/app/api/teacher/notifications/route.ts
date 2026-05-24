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
    if (!Array.isArray(notifications)) {
      throw new Error("Invalid notifications payload");
    }

    return jsonSuccess({ notifications });
  } catch (error) {
    console.error("[teacher/notifications GET]", error);
    return jsonSuccess({ notifications: [] });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const { notificationId, action } = body;
    if (!notificationId) return jsonError("notificationId required", 400);

    if (action === "read") {
      const ok = await markNotificationRead(notificationId, user.id);
      if (!ok) return jsonError("Notification not found", 404);
      return jsonSuccess({ read: true });
    }

    if (action === "pin") {
      return jsonError("Pin action not supported", 400);
    }

    return jsonError("Unknown notification action", 400);
  } catch (error) {
    console.error("[teacher/notifications PATCH]", error);
    return jsonError("Failed to update notification", 500);
  }
}
