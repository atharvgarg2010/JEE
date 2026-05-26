import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { assignTeacherToBatch, removeTeacherFromBatch } from "@/lib/db/batches";
import { z } from "zod";

export const dynamic = "force-dynamic";

const assignSchema = z.object({
  teacher_id: z.string().uuid(),
  subject_id: z.string().uuid(),
});

const removeSchema = z.object({
  subject_id: z.string().uuid(),
});

/**
 * PUT /api/admin/batches/[batchId]/teachers
 * Assign (or replace) a teacher for a subject in a batch.
 * Body: { teacher_id, subject_id }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { batchId } = await params;

  try {
    const body = await request.json();
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    await assignTeacherToBatch(batchId, parsed.data.teacher_id, parsed.data.subject_id);
    return jsonSuccess({ assigned: true });
  } catch (error: unknown) {
    console.error("[admin/batches/[batchId]/teachers PUT]", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23503"
    ) {
      return jsonError("Teacher or subject not found", 404);
    }
    return jsonError("Failed to assign teacher", 500);
  }
}

/**
 * DELETE /api/admin/batches/[batchId]/teachers
 * Remove a teacher from a subject slot in a batch.
 * Body: { subject_id }
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { batchId } = await params;

  try {
    const body = await request.json();
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("subject_id required", 400);
    }

    const ok = await removeTeacherFromBatch(batchId, parsed.data.subject_id);
    if (!ok) return jsonError("Teacher assignment not found", 404);

    return jsonSuccess({ removed: true });
  } catch (error) {
    console.error("[admin/batches/[batchId]/teachers DELETE]", error);
    return jsonError("Failed to remove teacher", 500);
  }
}
