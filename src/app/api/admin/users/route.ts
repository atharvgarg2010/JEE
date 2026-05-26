import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getPool } from "@/lib/db/postgres";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  batch_code: z.string().max(20).optional(),
});

/**
 * GET /api/admin/users?role=student|teacher
 * List all users by role.
 */
export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const role = new URL(request.url).searchParams.get("role");
  const pool = getPool();

  try {
    let query: string;
    let params: unknown[];

    if (role === "student" || role === "teacher") {
      query = `
        SELECT
          u.id, u.full_name, u.username, u.roll_number, u.batch_code,
          u.role, u.subject, u.teacher_code, u.experience, u.created_at,
          b.id AS batch_id, b.name AS batch_name
        FROM users u
        LEFT JOIN batch_students bs ON bs.student_id = u.id AND u.role = 'student'
        LEFT JOIN batches b ON b.id = bs.batch_id
        WHERE u.role = $1
        ORDER BY u.created_at DESC
      `;
      params = [role];
    } else {
      query = `
        SELECT
          u.id, u.full_name, u.username, u.roll_number, u.batch_code,
          u.role, u.subject, u.teacher_code, u.experience, u.created_at,
          b.id AS batch_id, b.name AS batch_name
        FROM users u
        LEFT JOIN batch_students bs ON bs.student_id = u.id AND u.role = 'student'
        LEFT JOIN batches b ON b.id = bs.batch_id
        WHERE u.role != 'admin'
        ORDER BY u.role, u.created_at DESC
      `;
      params = [];
    }

    const { rows } = await pool.query(query, params);
    const users = rows.map((r) => ({
      id: r.id as string,
      full_name: r.full_name as string | null,
      username: r.username as string,
      roll_number: r.roll_number as string | null,
      batch_code: r.batch_code as string | null,
      role: r.role as string,
      subject: r.subject as string | null,
      teacher_code: r.teacher_code as string | null,
      experience: r.experience as string | null,
      created_at: String(r.created_at),
      batch_id: r.batch_id as string | null,
      batch_name: r.batch_name as string | null,
    }));

    return jsonSuccess({ users, total: users.length });
  } catch (error) {
    console.error("[admin/users GET]", error);
    return jsonError("Failed to load users", 500);
  }
}
