import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  enrichStudentQuestion,
  listPracticeQuestions,
} from "@/lib/db/student-practice";
import { listStudentQuestions } from "@/lib/db/student-questions";
import type { PracticeFilter } from "@/types/questions";

export const dynamic = "force-dynamic";

const VALID_FILTERS: PracticeFilter[] = [
  "all",
  "attempted",
  "not_attempted",
  "doubts",
  "revision",
  "mastered",
  "wrong",
];

export async function GET(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const chapterId = searchParams.get("chapterId");
    const categoryId = searchParams.get("categoryId");
    const difficulty = searchParams.get("difficulty") ?? undefined;
    const filter = (searchParams.get("filter") ?? "all") as PracticeFilter;

    if (!subjectId || !chapterId) {
      return jsonError("subjectId and chapterId are required", 400);
    }

    if (!VALID_FILTERS.includes(filter)) {
      return jsonError("Invalid filter", 400);
    }

    let questions = await listPracticeQuestions(user.id, {
      subjectId,
      chapterId,
      categoryId: categoryId ?? undefined,
      difficulty,
      filter,
    });

    if (questions.length === 0 && filter === "all") {
      const raw = await listStudentQuestions({
        subjectId,
        chapterId,
        categoryId: categoryId ?? undefined,
        difficulty,
      });
      questions = await Promise.all(
        raw.map((q) => enrichStudentQuestion(user.id, q)),
      );
    }

    return jsonSuccess({ questions, total: questions.length });
  } catch (error) {
    console.error("[student/practice/questions]", error);
    return jsonError("Failed to load questions", 500);
  }
}
