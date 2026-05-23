import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getMistakeQuestions } from "@/lib/db/student-dashboard";
import type { MistakeFilter } from "@/types/dashboard";

export const dynamic = "force-dynamic";

const VALID: MistakeFilter[] = ["recent", "repeated", "chapter"];

export async function GET(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get("filter") ?? "recent") as MistakeFilter;
    const chapterId = searchParams.get("chapterId") ?? undefined;

    if (!VALID.includes(filter)) {
      return jsonError("Invalid filter", 400);
    }

    const questions = await getMistakeQuestions(user.id, filter, chapterId);
    return jsonSuccess({ questions, total: questions.length });
  } catch (error) {
    console.error("[student/mistakes]", error);
    return jsonError("Failed to load mistakes", 500);
  }
}
