import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonSuccess } from "@/lib/api/response";
import { getCategoryById } from "@/lib/db/metadata";
import { createQuestion, listQuestions } from "@/lib/db/questions";
import { createQuestionSchema } from "@/lib/validations/question";
import type { DifficultyLevel, QuestionType } from "@/types/questions";
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { z } from "zod";

const schema = z.object({
  subjectId: z.string(),
  chapterId: z.string(),
  categoryId: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  questionType: z.string(),
  questionText: z.string(),
  options: z.any().optional().nullable(),
  correctAnswer: z.any(),
  solution: z.string().optional().nullable(),
  tags: z.any().optional().nullable(),
}).and(createQuestionSchema);

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await requireTeacher();
    if (!isTeacherUser(user)) return user;

    const { searchParams } = new URL(req.url);
    const result = await withTimeout(listQuestions({
      teacher_id: user.id,
      search: searchParams.get("search") ?? undefined,
      subject_id: searchParams.get("subjectId") ?? undefined,
      chapter_id: searchParams.get("chapterId") ?? undefined,
      category_id: searchParams.get("categoryId") ?? undefined,
      difficulty: (searchParams.get("difficulty") as DifficultyLevel) ?? undefined,
      question_type: (searchParams.get("questionType") as QuestionType) ?? undefined,
      limit: Number(searchParams.get("limit") ?? 50),
      offset: Number(searchParams.get("offset") ?? 0),
    }));

    return jsonSuccess(result);
  }, request);
}

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 20, windowMs: 60 * 1000, identifier: `teacher_questions_post:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireTeacher();
    if (!isTeacherUser(user)) return user;

    const body = await parseRequestBody(req, z.any());
    
    const category = body.categoryId
      ? await withTimeout(getCategoryById(body.categoryId))
      : null;

    const data = await schema.parseAsync({
      ...body,
      categoryRequiresDifficulty: category?.supports_difficulty ?? false,
    });

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

    const rawOptions = data.questionType === "mcq" ? (data.options ?? []) : null;
    const normalizedOptions: import("@/types/questions").McqOption[] | null =
      rawOptions === null
        ? null
        : rawOptions.map((opt: any, index: number) =>
            typeof opt === "string"
              ? { id: `opt_${index + 1}`, text: opt.trim() }
              : { id: String(opt.id ?? `opt_${index + 1}`), text: String(opt.text ?? "") },
          );

    const question = await withTimeout(createQuestion({
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
    }));

    return jsonSuccess({ question }, 201);
  }, request);
}
