import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getTeacherStudentAnalytics } from "@/lib/db/teacher-student-analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const analytics = await getTeacherStudentAnalytics(user.id);
    return jsonSuccess({ analytics });
  } catch (error) {
    console.error("[teacher/student-analytics]", error);
    return jsonError("Failed to load student analytics", 500);
  }
}
