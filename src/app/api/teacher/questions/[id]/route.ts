import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { deleteQuestion, getQuestionById } from "@/lib/db/questions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const { id } = await params;
    const question = await getQuestionById(id, user.id);
    if (!question) return jsonError("Question not found", 404);
    return jsonSuccess({ question });
  } catch (error) {
    console.error("[teacher/questions/id GET]", error);
    return jsonError("Failed to load question", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const { id } = await params;
    const deleted = await deleteQuestion(id, user.id);
    if (!deleted) return jsonError("Question not found", 404);
    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error("[teacher/questions/id DELETE]", error);
    return jsonError("Failed to delete question", 500);
  }
}
