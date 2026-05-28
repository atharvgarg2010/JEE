import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { listModuleSets } from "@/lib/db/modules";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/modules
 * Optional query params: ?subject=&chapter=
 * Returns all module sets (filtered). Students don't create modules.
 */
export async function GET(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject") ?? undefined;
    const chapter = searchParams.get("chapter") ?? undefined;

    const modules = await listModuleSets({ subject, chapter });
    return jsonSuccess({ modules });
  } catch (error) {
    console.error("[student/modules GET]", error);
    return jsonError("Failed to load modules", 500);
  }
}
