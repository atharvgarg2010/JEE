import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { listModuleDoubtNotifications } from "@/lib/db/modules";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/module-doubts
 * Returns module doubt notifications visible to this teacher.
 * Defaults: unresolved=true, newest first.
 * Filter-ready query params (all optional, for future UI exposure):
 *   ?resolved=true|false   (default: false)
 *   ?subject=
 *   ?chapter=
 *   ?module_set_id=
 *   ?status=doubt|revision
 */
export async function GET(request: Request) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const { searchParams } = new URL(request.url);

    // Parse filter-ready params — all optional
    const resolvedParam = searchParams.get("resolved");
    const resolved = resolvedParam === "true" ? true : false; // default: unresolved

    const filters = {
      resolved,
      subject: searchParams.get("subject") ?? undefined,
      chapter: searchParams.get("chapter") ?? undefined,
      module_set_id: searchParams.get("module_set_id") ?? undefined,
      status: (searchParams.get("status") as "doubt" | "revision" | null) ?? undefined,
    };

    const notifications = await listModuleDoubtNotifications(user.id, filters);
    return jsonSuccess({ notifications });
  } catch (error) {
    console.error("[teacher/module-doubts GET]", error);
    return jsonError("Failed to load module doubts", 500);
  }
}
