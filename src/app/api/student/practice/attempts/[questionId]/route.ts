import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonSuccess } from "@/lib/api/response";
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
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  doubtMarked: z.boolean().optional().nullable(),
  doubtResolved: z.boolean().optional().nullable(),
  savedForRevision: z.boolean().optional().nullable(),
  prepareReattempt: z.boolean().optional().nullable(),
  viewSolution: z.boolean().optional().nullable(),
}).and(updateAttemptSchema);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  return withApiErrorHandler(async (req) => {
    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const { questionId } = await params;
    const [question, progress, history, views] = await Promise.all([
      withTimeout(getStudentQuestion(user.id, questionId, false)),
      withTimeout(getProgress(user.id, questionId)),
      withTimeout(getAttemptHistory(user.id, questionId)),
      withTimeout(getSolutionViews(user.id, questionId)),
    ]);

    if (!question) throw new ValidationError("Question not found");

    return jsonSuccess({ question, progress, history, solutionViews: views });
  }, request);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 30, windowMs: 60 * 1000, identifier: `student_practice_attempt_patch:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const { questionId } = await params;
    const data = await parseRequestBody(req, schema);

    let solution: string | null = null;
    let viewCount = 0;

    if (data.viewSolution) {
      const latest = await withTimeout(getLatestAttempt(user.id, questionId));
      const hasAttempts = (await withTimeout(getProgress(user.id, questionId)))?.total_attempts ?? 0;
      let context: SolutionViewContext = "while_reviewing";
      if (hasAttempts === 0) context = "before_solve";
      else if (latest && !latest.is_correct) context = "after_wrong";
      else if (latest?.is_correct) context = "after_correct";

      const result = await withTimeout(recordSolutionView(
        user.id,
        questionId,
        context,
        latest?.attempt_number,
      ));
      viewCount = result.viewCount;
      solution = await withTimeout(fetchSolutionText(questionId));
    }

    const progress = await withTimeout(updateProgressFlags(user.id, questionId, {
      doubt_marked: data.doubtMarked,
      doubt_resolved: data.doubtResolved,
      saved_for_revision: data.savedForRevision,
      status: data.prepareReattempt ? "REATTEMPT" : undefined,
    }));

    const history = await withTimeout(getAttemptHistory(user.id, questionId));

    return jsonSuccess({
      progress,
      history,
      solution,
      solutionViewCount: viewCount,
    });
  }, request);
}
