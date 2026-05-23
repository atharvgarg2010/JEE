import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getChaptersForSubject } from "@/lib/db/student-dashboard";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const { slug } = await params;
    const data = await getChaptersForSubject(user.id, slug);
    if (!data) return jsonError("Subject not found", 404);
    return jsonSuccess(data);
  } catch (error) {
    console.error("[student/subjects]", error);
    return jsonError("Failed to load subject", 500);
  }
}
