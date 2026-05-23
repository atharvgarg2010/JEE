import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getTeacherQuestionStats } from "@/lib/db/questions";

export async function GET() {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const stats = await getTeacherQuestionStats(user.id);
    return jsonSuccess({ stats });
  } catch (error) {
    console.error("[teacher/stats]", error);
    return jsonError("Failed to load stats", 500);
  }
}
