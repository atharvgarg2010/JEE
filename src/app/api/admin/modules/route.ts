import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { createModuleSet, listModuleSets } from "@/lib/db/modules";
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
});

/** GET /api/admin/modules — list all module sets */
export async function GET() {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  try {
    const modules = await listModuleSets();
    return jsonSuccess({ modules });
  } catch (error) {
    console.error("[admin/modules GET]", error);
    return jsonError("Failed to load modules", 500);
  }
}

/** POST /api/admin/modules — create a module set */
export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  try {
    const body = await request.json();
    const parsed = createModuleSetSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const module = await createModuleSet({
      ...parsed.data,
      created_by: user.id,
    });

    return jsonSuccess({ module }, 201);
  } catch (error) {
    console.error("[admin/modules POST]", error);
    return jsonError("Failed to create module", 500);
  }
}
