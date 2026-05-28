import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { createOrGetModuleDoubtNotification } from "@/lib/db/modules";
import { z } from "zod";

export const dynamic = "force-dynamic";

const notifySchema = z.object({
  question_number: z.number().int().min(1),
  status: z.enum(["doubt", "revision"]),
});

/**
 * POST /api/student/modules/[moduleSetId]/notify
 * Creates a doubt/revision notification for the teacher.
 * DEDUP: If an unresolved notification already exists for the same
 * (student, module, question), returns the existing one without creating a duplicate.
 * NOT automatic — must be triggered explicitly by the student.
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
    const parsed = notifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { notification, created } = await createOrGetModuleDoubtNotification({
      student_id: user.id,
      module_set_id: moduleSetId,
      question_number: parsed.data.question_number,
      status: parsed.data.status,
    });

    const status = created ? 201 : 200;
    return jsonSuccess({ notification, created }, status);
  } catch (error) {
    console.error("[student/modules/notify POST]", error);
    return jsonError("Failed to send notification", 500);
  }
}
