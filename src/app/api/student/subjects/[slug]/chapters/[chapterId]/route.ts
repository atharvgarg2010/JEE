import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getChapterAnalytics } from "@/lib/db/student-dashboard";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; chapterId: string }> },
) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { slug, chapterId } = await params;
    const analytics = await getChapterAnalytics(user.id, slug, chapterId);
    if (!analytics) return jsonError("Chapter not found", 404);
    return jsonSuccess({ analytics });
  } catch (error) {
    console.error("[student/chapter analytics]", error);
    return jsonError("Failed to load chapter analytics", 500);
  }
}
