import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonSuccess } from "@/lib/api/response";
import { listChapters, createChapter } from "@/lib/db/structure";
import { withApiErrorHandler } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { logAuditAction } from "@/lib/db/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createChapterSchema = z.object({
  subject_id: z.string().uuid(),
  name: z.string().min(1).max(200).trim(),
  sort_order: z.number().int().default(0),
}).strict();

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId") || undefined;

    const chapters = await withTimeout(listChapters(subjectId));
    return jsonSuccess({ chapters });
  }, request);
}

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 20, windowMs: 60 * 1000, identifier: `admin_chapters_post:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const data = await parseRequestBody(req, createChapterSchema);

    const chapter = await withTimeout(createChapter(data));

    await logAuditAction({
      actorId: user.id,
      actorRole: user.role,
      action: "CREATE_CHAPTER",
      entityType: "chapters",
      entityId: chapter.id,
      metadata: { name: data.name, subject_id: data.subject_id },
    });

    return jsonSuccess({ chapter }, 201);
  }, request);
}
