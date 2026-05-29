import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { updateChapter, deleteChapter } from "@/lib/db/structure";
import { withApiErrorHandler } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { logAuditAction } from "@/lib/db/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateChapterSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  sort_order: z.number().int().optional(),
}).strict().refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 20, windowMs: 60 * 1000, identifier: `admin_chapters_patch:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const { id } = await params;
    const data = await parseRequestBody(req, updateChapterSchema);

    const chapter = await withTimeout(updateChapter(id, data));
    
    if (!chapter) {
      return jsonError("Chapter not found", 404);
    }

    await logAuditAction({
      actorId: user.id,
      actorRole: user.role,
      action: "UPDATE_CHAPTER",
      entityType: "chapters",
      entityId: id,
      metadata: { changes: data },
    });

    return jsonSuccess({ chapter });
  }, request);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 10, windowMs: 60 * 1000, identifier: `admin_chapters_delete:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const { id } = await params;

    try {
      const ok = await withTimeout(deleteChapter(id));
      
      if (!ok) {
        return jsonError("Chapter not found", 404);
      }

      await logAuditAction({
        actorId: user.id,
        actorRole: user.role,
        action: "DELETE_CHAPTER",
        entityType: "chapters",
        entityId: id,
      });

      return jsonSuccess({ deleted: true });
    } catch (error: any) {
      // The db layer throws a custom error if linked modules exist
      if (error.message && error.message.includes("modules linked to it")) {
         return jsonError(error.message, 400);
      }
      throw error;
    }
  }, request);
}
