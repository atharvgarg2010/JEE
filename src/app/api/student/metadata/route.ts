import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCategories, getChapters, getSubjects } from "@/lib/db/metadata";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId") ?? undefined;

    const [subjects, chapters, categories] = await Promise.all([
      getSubjects(),
      getChapters(subjectId),
      getCategories(),
    ]);

    return jsonSuccess({ subjects, chapters, categories });
  } catch (error) {
    console.error("[student/metadata]", error);
    return jsonError("Failed to load metadata", 500);
  }
}
