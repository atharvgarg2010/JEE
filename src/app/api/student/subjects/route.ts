import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getSubjects } from "@/lib/db/metadata";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const subjects = await getSubjects();
    return jsonSuccess({ subjects });
  } catch (error) {
    console.error("[student/subjects]", error);
    return jsonError("Failed to load subjects", 500);
  }
}
