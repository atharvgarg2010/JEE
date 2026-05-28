import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { resolveModuleDoubtNotification } from "@/lib/db/modules";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/teacher/module-doubts/[notifId]
 * Marks a doubt notification as resolved.
 * Verifies the teacher has access (is in a shared batch with the student).
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notifId: string }> },
) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const { notifId } = await params;
    const success = await resolveModuleDoubtNotification(notifId, user.id);

    if (!success) {
      return jsonError(
        "Notification not found or you do not have access",
        404,
      );
    }

    return jsonSuccess({ resolved: true });
  } catch (error) {
    console.error("[teacher/module-doubts PATCH]", error);
    return jsonError("Failed to resolve notification", 500);
  }
}
