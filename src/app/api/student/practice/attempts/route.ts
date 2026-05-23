import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import {
  getAttemptHistory,
  insertAttempt,
} from "@/lib/db/question-attempts";
import { verifyAnswer } from "@/lib/db/student-practice";
import { submitAttemptSchema } from "@/lib/validations/attempt";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const body = await request.json();
    const parsed = submitAttemptSchema.safeParse({
      questionId: body.questionId,
      selectedAnswer: String(body.selectedAnswer ?? ""),
      timeTakenSeconds: Number(body.timeTakenSeconds ?? 0),
      doubtMarked: body.doubtMarked,
    });

    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { questionId, selectedAnswer, timeTakenSeconds, doubtMarked } =
      parsed.data;

    const isCorrect = await verifyAnswer(questionId, selectedAnswer);

    const { attempt, progress } = await insertAttempt({
      student_id: user.id,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_taken_seconds: timeTakenSeconds,
      doubt_marked: doubtMarked,
    });

    const history = await getAttemptHistory(user.id, questionId);

    return jsonSuccess({
      attempt,
      progress,
      history,
      is_correct: isCorrect,
      show_result: true,
    });
  } catch (error) {
    console.error("[student/practice/attempts POST]", error);
    return jsonError("Failed to submit attempt", 500);
  }
}
