import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonSuccess } from "@/lib/api/response";
import { listSubjects } from "@/lib/db/structure";
import { withApiErrorHandler } from "@/lib/api/error";
import { withTimeout } from "@/lib/api/timeout";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const subjects = await withTimeout(listSubjects());
    return jsonSuccess({ subjects });
  }, request);
}
