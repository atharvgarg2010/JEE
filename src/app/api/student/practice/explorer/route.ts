import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  enrichStudentQuestion,
  getChapterProgressSummary,
  getExplorerProgress,
  listPracticeQuestions,
} from "@/lib/db/student-practice";
import { listStudentQuestions } from "@/lib/db/student-questions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const chapterId = searchParams.get("chapterId");

    if (!subjectId) {
      return jsonError("subjectId is required", 400);
    }

    if (chapterId) {
      const categoryId = searchParams.get("categoryId") ?? undefined;
      const difficulty = searchParams.get("difficulty") ?? undefined;

      const [categories, rawQuestions, withAttempts] = await Promise.all([
        getExplorerProgress(user.id, subjectId, chapterId),
        listStudentQuestions({ subjectId, chapterId, categoryId, difficulty }),
        listPracticeQuestions(user.id, {
          subjectId,
          chapterId,
          categoryId,
          difficulty,
          filter: "all",
        }),
      ]);

      let questions = withAttempts;

      if (questions.length === 0 && rawQuestions.length > 0) {
        questions = await Promise.all(
          rawQuestions.map((q) => enrichStudentQuestion(user.id, q)),
        );
      }

      const totalQuestions = Math.max(
        categories.reduce((sum, c) => sum + c.total, 0),
        questions.length,
      );

      return jsonSuccess({
        categories,
        questions,
        totalQuestions,
      });
    }

    const chapters = await getChapterProgressSummary(user.id, subjectId);
    return jsonSuccess({ chapters });
  } catch (error) {
    console.error("[student/explorer]", error);
    return jsonError("Failed to load progress", 500);
  }
}
