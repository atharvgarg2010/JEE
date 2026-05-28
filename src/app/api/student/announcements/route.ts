import { isStudentUser, requireStudent } from "@/lib/auth/student";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getPool } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/announcements
 * Returns announcements for the student's enrolled batch.
 * Ordered: unread first, newest first within each group.
 */
export async function GET() {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const pool = getPool();

    const { rows } = await pool.query(
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
    );

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
  } catch (error) {
    console.error("[student/announcements GET]", error);
    return jsonError("Failed to load announcements", 500);
  }
}

/**
 * PATCH /api/student/announcements
 * Mark an announcement as read (idempotent).
 */
export async function PATCH(request: Request) {
  const user = await requireStudent();
  if (!isStudentUser(user)) return user;

  try {
    const body = await request.json();
    const announcementId = body.announcementId;
    if (!announcementId || typeof announcementId !== "string") {
      return jsonError("announcementId required", 400);
    }

    // Verify the announcement belongs to the student's batch before marking read
    const pool = getPool();
    const check = await pool.query(
      `SELECT 1
       FROM announcements a
       JOIN batch_students bs ON bs.batch_id = a.batch_id AND bs.student_id = $2
       WHERE a.id = $1
       LIMIT 1`,
      [announcementId, user.id]
    );
    if (check.rows.length === 0) {
      return jsonError("Announcement not found in your batch", 404);
    }

    await pool.query(
      `INSERT INTO announcement_reads (announcement_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (announcement_id, student_id) DO NOTHING`,
      [announcementId, user.id]
    );

    return jsonSuccess({ read: true });
  } catch (error) {
    console.error("[student/announcements PATCH]", error);
    return jsonError("Failed to mark announcement as read", 500);
  }
}
