import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { getCategoryById } from "@/lib/db/metadata";
import { createQuestion, listQuestions } from "@/lib/db/questions";
import { createQuestionSchema } from "@/lib/validations/question";
import type { DifficultyLevel, QuestionType } from "@/types/questions";

export async function GET(request: Request) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listQuestions({
      teacher_id: user.id,
      search: searchParams.get("search") ?? undefined,
      subject_id: searchParams.get("subjectId") ?? undefined,
      chapter_id: searchParams.get("chapterId") ?? undefined,
      category_id: searchParams.get("categoryId") ?? undefined,
      difficulty: (searchParams.get("difficulty") as DifficultyLevel) ?? undefined,
      question_type: (searchParams.get("questionType") as QuestionType) ?? undefined,
      limit: Number(searchParams.get("limit") ?? 50),
      offset: Number(searchParams.get("offset") ?? 0),
    });

    return jsonSuccess(result);
  } catch (error) {
    console.error("[teacher/questions GET]", error);
    return jsonError("Failed to load questions", 500);
  }
}

export async function POST(request: Request) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const body = await request.json();
    const category = body.categoryId
      ? await getCategoryById(body.categoryId)
      : null;

    const parsed = createQuestionSchema.safeParse({
      subjectId: body.subjectId,
      chapterId: body.chapterId,
      categoryId: body.categoryId,
      difficulty: body.difficulty ?? null,
      questionType: body.questionType,
      questionText: body.questionText,
      options: body.options,
      correctAnswer: body.correctAnswer,
      solution: body.solution ?? "",
      tags: Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === "string"
        ? body.tags
        : [],
      categoryRequiresDifficulty: category?.supports_difficulty ?? false,
    });

    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const data = parsed.data;
    const normalizedTags = Array.isArray(data.tags)
      ? data.tags
      : String(data.tags)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
    const normalizedCorrectAnswer =
      data.questionType === "integer"
        ? Number(data.correctAnswer)
        : String(data.correctAnswer);

    // Normalize options to McqOption[] | null regardless of whether the
    // Zod schema inferred string[] or McqOption[].
    const rawOptions = data.questionType === "mcq" ? (data.options ?? []) : null;
    const normalizedOptions: import("@/types/questions").McqOption[] | null =
      rawOptions === null
        ? null
        : rawOptions.map((opt, index) =>
            typeof opt === "string"
              ? { id: `opt_${index + 1}`, text: opt.trim() }
              : { id: String(opt.id ?? `opt_${index + 1}`), text: String(opt.text ?? "") },
          );

    const question = await createQuestion({
      teacher_id: user.id,
      subject_id: data.subjectId,
      chapter_id: data.chapterId,
      category_id: data.categoryId,
      difficulty: data.difficulty ?? null,
      question_type: data.questionType,
      question_text: data.questionText,
      options: normalizedOptions,
      correct_answer: normalizedCorrectAnswer,
      solution: data.solution,
      tags: normalizedTags,
    });

    return jsonSuccess({ question }, 201);
  } catch (error) {
    console.error("[teacher/questions POST]", error);
    return jsonError("Failed to create question", 500);
  }
}
