import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonSuccess } from "@/lib/api/response";
import { previewAutoLink, executeAutoLink } from "@/lib/db/auto-link";
import { withApiErrorHandler } from "@/lib/api/error";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { logAuditAction } from "@/lib/db/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const preview = await withTimeout(previewAutoLink());
    return jsonSuccess({ preview });
  }, request);
}

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 5, windowMs: 60 * 1000, identifier: `admin_autolink_post:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    // Recalculate preview securely on the server
    const preview = await withTimeout(previewAutoLink());
    
    if (preview.matched.length === 0) {
      return jsonSuccess({ updated: 0, message: "No matching modules found to link." });
    }

    // Map to required input format
    const executePayload = preview.matched.map(m => ({
      moduleId: m.moduleId,
      newChapterId: m.newChapterId
    }));

    const updatedCount = await withTimeout(executeAutoLink(executePayload));

    await logAuditAction({
      actorId: user.id,
      actorRole: user.role,
      action: "AUTO_LINK_MODULES",
      entityType: "module_sets",
      metadata: { updatedCount },
    });

    return jsonSuccess({ updated: updatedCount });
  }, request);
}
