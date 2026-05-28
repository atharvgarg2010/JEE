import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { deleteModuleSet } from "@/lib/db/modules";

export const dynamic = "force-dynamic";

/** DELETE /api/admin/modules/[id] — delete a module set */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const { id } = await params;

  try {
    const ok = await deleteModuleSet(id);
    if (!ok) {
      return jsonError("Module not found", 404);
    }
    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error("[admin/modules/[id] DELETE]", error);
    return jsonError("Failed to delete module", 500);
  }
}
