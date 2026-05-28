import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonSuccess } from "@/lib/api/response";
import { createModuleSet, listModuleSets } from "@/lib/db/modules";
import { withApiErrorHandler } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { logAuditAction } from "@/lib/db/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createModuleSetSchema = z.object({
  subject: z.string().min(1).max(100).trim(),
  chapter: z.string().min(1).max(200).trim(),
  module_name: z.string().min(1).max(200).trim(),
  question_count: z
    .number()
    .int()
    .min(1, "Must have at least 1 question")
    .max(1000, "Maximum 1000 questions per module"),
}).strict();

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const modules = await withTimeout(listModuleSets());
    return jsonSuccess({ modules });
  }, request);
}

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 10, windowMs: 60 * 1000, identifier: `admin_modules_post:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireAdmin();
    if (!isAdminUser(user)) return user;

    const data = await parseRequestBody(req, createModuleSetSchema);

    const module = await withTimeout(createModuleSet({
      ...data,
      created_by: user.id,
    }));

    await logAuditAction({
      actorId: user.id,
      actorRole: user.role,
      action: "CREATE_MODULE_SET",
      entityType: "module_sets",
      entityId: module.id,
      metadata: { module_name: data.module_name, reqUrl: req.url },
    });

    return jsonSuccess({ module }, 201);
  }, request);
}
