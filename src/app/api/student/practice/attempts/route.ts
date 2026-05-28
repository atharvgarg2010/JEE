import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonSuccess } from "@/lib/api/response";
import {
  getAttemptHistory,
  insertAttempt,
} from "@/lib/db/question-attempts";
import { verifyAnswer } from "@/lib/db/student-practice";
import { submitAttemptSchema } from "@/lib/validations/attempt";
import { withApiErrorHandler } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  questionId: z.string(),
  selectedAnswer: z.string().optional().nullable(),
  timeTakenSeconds: z.number().optional().nullable(),
  doubtMarked: z.boolean().optional().nullable(),
}).and(submitAttemptSchema);

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 60, windowMs: 60 * 1000, identifier: `student_practice_attempts:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const body = await parseRequestBody(req, z.any()); // Parse as any first to coerce
    const data = await schema.parseAsync({
      questionId: body.questionId,
      selectedAnswer: String(body.selectedAnswer ?? ""),
      timeTakenSeconds: Number(body.timeTakenSeconds ?? 0),
      doubtMarked: body.doubtMarked,
    });

    const { questionId, selectedAnswer, timeTakenSeconds, doubtMarked } = data;

    const isCorrect = await withTimeout(verifyAnswer(questionId, selectedAnswer));

    const { attempt, progress } = await withTimeout(insertAttempt({
      student_id: user.id,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_taken_seconds: timeTakenSeconds,
      doubt_marked: doubtMarked,
    }));

    const history = await withTimeout(getAttemptHistory(user.id, questionId));

    return jsonSuccess({
      attempt,
      progress,
      history,
      is_correct: isCorrect,
      show_result: true,
    });
  }, request);
}
