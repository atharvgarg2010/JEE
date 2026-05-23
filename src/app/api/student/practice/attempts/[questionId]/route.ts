import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import {
  getAttemptHistory,
  getLatestAttempt,
  getProgress,
  getSolutionViews,
  recordSolutionView,
  updateProgressFlags,
} from "@/lib/db/question-attempts";
import {
  fetchSolutionText,
  getStudentQuestion,
} from "@/lib/db/student-practice";
import { updateAttemptSchema } from "@/lib/validations/attempt";
import type { SolutionViewContext } from "@/lib/constants/questions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { questionId } = await params;
    const [question, progress, history, views] = await Promise.all([
      getStudentQuestion(user.id, questionId, false),
      getProgress(user.id, questionId),
      getAttemptHistory(user.id, questionId),
      getSolutionViews(user.id, questionId),
    ]);

    if (!question) return jsonError("Question not found", 404);

    return jsonSuccess({ question, progress, history, solutionViews: views });
  } catch (error) {
    console.error("[attempts GET]", error);
    return jsonError("Failed to load attempt data", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { questionId } = await params;
    const body = await request.json();
    const parsed = updateAttemptSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const data = parsed.data;
    let solution: string | null = null;
    let viewCount = 0;

    if (data.viewSolution) {
      const latest = await getLatestAttempt(user.id, questionId);
      const hasAttempts = (await getProgress(user.id, questionId))?.total_attempts ?? 0;
      let context: SolutionViewContext = "while_reviewing";
      if (hasAttempts === 0) context = "before_solve";
      else if (latest && !latest.is_correct) context = "after_wrong";
      else if (latest?.is_correct) context = "after_correct";

      const result = await recordSolutionView(
        user.id,
        questionId,
        context,
        latest?.attempt_number,
      );
      viewCount = result.viewCount;
      solution = await fetchSolutionText(questionId);
    }

    const progress = await updateProgressFlags(user.id, questionId, {
      doubt_marked: data.doubtMarked,
      doubt_resolved: data.doubtResolved,
      saved_for_revision: data.savedForRevision,
      status: data.prepareReattempt ? "REATTEMPT" : undefined,
    });

    const history = await getAttemptHistory(user.id, questionId);

    return jsonSuccess({
      progress,
      history,
      solution,
      solutionViewCount: viewCount,
    });
  } catch (error) {
    console.error("[attempts PATCH]", error);
    return jsonError("Failed to update attempt", 500);
  }
}
