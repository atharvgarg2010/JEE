import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getRevisionQuestions } from "@/lib/db/student-dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const questions = await getRevisionQuestions(user.id);
    return jsonSuccess({ questions, total: questions.length });
  } catch (error) {
    console.error("[student/revision]", error);
    return jsonError("Failed to load revision list", 500);
  }
}
