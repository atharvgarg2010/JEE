import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getExplorerTree } from "@/lib/db/explorer-tree";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const tree = await getExplorerTree(user.id);
    return jsonSuccess({ tree });
  } catch (error) {
    console.error("[student/explorer/tree]", error);
    return jsonError("Failed to load explorer tree", 500);
  }
}
