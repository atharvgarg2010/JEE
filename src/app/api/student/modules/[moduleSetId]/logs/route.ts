import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { getLogsForModule, upsertQuestionLog } from "@/lib/db/modules";
import { z } from "zod";

export const dynamic = "force-dynamic";

const upsertLogSchema = z.object({
  question_number: z
    .number()
    .int()
    .min(1, "question_number must be >= 1"),
  status: z.enum(["done", "doubt", "revision", "not_done"]),
});

/**
 * GET /api/student/modules/[moduleSetId]/logs
 * Returns all logs for this student in this module + pre-computed analytics.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ moduleSetId: string }> },
) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { moduleSetId } = await params;
    const result = await getLogsForModule(user.id, moduleSetId);
    return jsonSuccess({
      logs: result.logs,
      analytics: result.analytics,
      question_count: result.question_count,
    });
  } catch (error) {
    console.error("[student/modules/logs GET]", error);
    return jsonError("Failed to load logs", 500);
  }
}

/**
 * POST /api/student/modules/[moduleSetId]/logs
 * Upsert a single question status for this student.
 * Validates question_number against module's question_count.
 * Students can only modify their own logs (enforced by using session user.id).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleSetId: string }> },
) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { moduleSetId } = await params;
    const body = await request.json();
    const parsed = upsertLogSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const log = await upsertQuestionLog(
      user.id,
      moduleSetId,
      parsed.data.question_number,
      parsed.data.status,
    );

    if (!log) {
      return jsonError(
        "Invalid question number or module not found",
        400,
      );
    }

    return jsonSuccess({ log });
  } catch (error) {
    console.error("[student/modules/logs POST]", error);
    return jsonError("Failed to update question status", 500);
  }
}
