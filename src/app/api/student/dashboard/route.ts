import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getDashboardOverview } from "@/lib/db/student-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const overview = await getDashboardOverview(user.id);
    return jsonSuccess({ overview });
  } catch (error) {
    console.error("[student/dashboard]", error);
    return jsonError("Failed to load dashboard", 500);
  }
}
