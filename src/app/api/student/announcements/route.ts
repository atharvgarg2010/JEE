import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonSuccess } from "@/lib/api/response";
import { getPool } from "@/lib/db/postgres";
import { withApiErrorHandler, ValidationError } from "@/lib/api/error";
import { parseRequestBody } from "@/lib/api/validation";
import { verifyCsrf } from "@/lib/api/csrf";
import { rateLimit } from "@/lib/api/rate-limit";
import { withTimeout } from "@/lib/api/timeout";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  announcementId: z.string().uuid(),
}).strict();

export async function GET(request: Request) {
  return withApiErrorHandler(async (req) => {
    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const pool = getPool();

    const { rows } = await withTimeout(pool.query(
      `SELECT
         a.id,
         a.batch_id,
         a.title,
         a.body,
         a.priority,
         a.created_at,
         b.name  AS batch_name,
         b.code  AS batch_code,
         COALESCE(u.full_name, u.username) AS teacher_name,
         ar.read_at
       FROM batch_students bs
       JOIN announcements a  ON a.batch_id = bs.batch_id
       JOIN batches b        ON b.id = bs.batch_id
       JOIN users u          ON u.id = a.teacher_id
       LEFT JOIN announcement_reads ar
         ON ar.announcement_id = a.id AND ar.student_id = bs.student_id
       WHERE bs.student_id = $1
       ORDER BY (ar.read_at IS NULL) DESC, a.created_at DESC
       LIMIT 50`,
      [user.id]
    ));

    const announcements = rows.map((r) => ({
      id: r.id as string,
      batch_id: r.batch_id as string,
      batch_name: r.batch_name as string,
      batch_code: r.batch_code as string,
      title: r.title as string,
      body: r.body as string,
      priority: r.priority as "normal" | "important" | "urgent",
      teacher_name: r.teacher_name as string,
      created_at: String(r.created_at),
      is_read: r.read_at !== null,
    }));

    return jsonSuccess({ announcements });
  }, request);
}

export async function PATCH(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 30, windowMs: 60 * 1000, identifier: `student_announcements_read:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const user = await requireStudent();
    if (!isStudentUser(user)) return user;

    const data = await parseRequestBody(req, patchSchema);
    const announcementId = data.announcementId;

    const pool = getPool();
    const check = await withTimeout(pool.query(
      `SELECT 1
       FROM announcements a
       JOIN batch_students bs ON bs.batch_id = a.batch_id AND bs.student_id = $2
       WHERE a.id = $1
       LIMIT 1`,
      [announcementId, user.id]
    ));
    if (check.rows.length === 0) {
      throw new ValidationError("Announcement not found in your batch");
    }

    await withTimeout(pool.query(
      `INSERT INTO announcement_reads (announcement_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (announcement_id, student_id) DO NOTHING`,
      [announcementId, user.id]
    ));

    return jsonSuccess({ read: true });
  }, request);
}
