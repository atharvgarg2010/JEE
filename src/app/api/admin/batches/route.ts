import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { createBatch, listBatchesWithStats } from "@/lib/db/batches";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBatchSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric"),
  description: z.string().max(500).optional(),
});

/** GET /api/admin/batches — list all batches with stats */
export async function GET() {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  try {
    const batches = await listBatchesWithStats();
    return jsonSuccess({ batches });
  } catch (error) {
    console.error("[admin/batches GET]", error);
    return jsonError("Failed to load batches", 500);
  }
}

/** POST /api/admin/batches — create a new batch */
export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  try {
    const body = await request.json();
    const parsed = createBatchSchema.safeParse(body);
    if (!parsed.success) {
      const msg = zodErrorMessage(parsed.error);
      return jsonError(msg, 400);
    }

    const batch = await createBatch({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
    });

    return jsonSuccess({ batch }, 201);
  } catch (error: unknown) {
    console.error("[admin/batches POST]", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return jsonError("A batch with that code already exists", 409);
    }
    return jsonError("Failed to create batch", 500);
  }
}
