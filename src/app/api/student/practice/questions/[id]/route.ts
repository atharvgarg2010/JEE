import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getLatestAttempt, getProgress } from "@/lib/db/question-attempts";
import {
  fetchSolutionText,
  getStudentQuestion,
} from "@/lib/db/student-practice";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { id } = await params;
    const [progress, latest] = await Promise.all([
      getProgress(user.id, id),
      getLatestAttempt(user.id, id),
    ]);
    const includeSolution =
      (progress?.solution_view_count ?? 0) > 0 || latest?.viewed_solution === true;
    const question = await getStudentQuestion(user.id, id, includeSolution);

    if (!question) return jsonError("Question not found", 404);

    let solution: string | null = null;
    if (includeSolution) {
      solution =
        question.solution ?? (await fetchSolutionText(id));
    }

    return jsonSuccess({
      question,
      progress,
      latest_attempt: latest,
      solution,
    });
  } catch (error) {
    console.error("[student/practice/question]", error);
    return jsonError("Failed to load question", 500);
  }
}
