import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { getDoubtQuestions } from "@/lib/db/student-dashboard";
import { updateProgressFlags } from "@/lib/db/question-attempts";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  questionId: z.string().uuid(),
  doubtResolved: z.boolean(),
});

export async function GET(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const resolved = new URL(request.url).searchParams.get("resolved");
    const resolvedFilter =
      resolved === "true" ? true : resolved === "false" ? false : undefined;

    const questions = await getDoubtQuestions(user.id, resolvedFilter);
    return jsonSuccess({ questions, total: questions.length });
  } catch (error) {
    console.error("[student/doubts GET]", error);
    return jsonError("Failed to load doubts", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const progress = await updateProgressFlags(
      user.id,
      parsed.data.questionId,
      { doubt_resolved: parsed.data.doubtResolved },
    );

    return jsonSuccess({ progress });
  } catch (error) {
    console.error("[student/doubts PATCH]", error);
    return jsonError("Failed to update doubt", 500);
  }
}
