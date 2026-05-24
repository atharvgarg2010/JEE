import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getTeacherQuestionInsights } from "@/lib/db/questions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const insights = await getTeacherQuestionInsights(user.id);
    return jsonSuccess({ insights });
  } catch (error) {
    console.error("[teacher/question-insights]", error);
    return jsonError("Failed to load question insights", 500);
  }
}
