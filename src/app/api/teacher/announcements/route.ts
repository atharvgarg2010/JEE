import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { getPool } from "@/lib/db/postgres";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createAnnouncementSchema = z.object({
  batch_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});

/**
 * GET /api/teacher/announcements
 * Returns announcements posted by this teacher, ordered by most recent.
 */
export async function GET() {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT
         a.id, a.batch_id, a.title, a.body, a.created_at,
         b.name AS batch_name, b.code AS batch_code
       FROM announcements a
       JOIN batches b ON b.id = a.batch_id
       WHERE a.teacher_id = $1
       ORDER BY a.created_at DESC
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
      created_at: String(r.created_at),
    }));

    return jsonSuccess({ announcements });
  } catch (error) {
    console.error("[teacher/announcements GET]", error);
    return jsonError("Failed to load announcements", 500);
  }
}

/**
 * POST /api/teacher/announcements
 * Post a new announcement to an assigned batch.
 * Validates that the teacher is actually assigned to the batch.
 */
export async function POST(request: Request) {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

  try {
    const body = await request.json();
    const parsed = createAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const pool = getPool();

    // Validate teacher is assigned to this batch
    const assignmentCheck = await pool.query(
      `SELECT 1 FROM batch_teachers WHERE batch_id = $1 AND teacher_id = $2 LIMIT 1`,
      [parsed.data.batch_id, user.id]
    );
    if (assignmentCheck.rows.length === 0) {
      return jsonError("You are not assigned to this batch", 403);
    }

    const { rows } = await pool.query(
      `INSERT INTO announcements (teacher_id, batch_id, title, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, parsed.data.batch_id, parsed.data.title, parsed.data.body]
    );

    const r = rows[0];
    const announcement = {
      id: r.id as string,
      batch_id: r.batch_id as string,
      title: r.title as string,
      body: r.body as string,
      created_at: String(r.created_at),
    };

    return jsonSuccess({ announcement }, 201);
  } catch (error) {
    console.error("[teacher/announcements POST]", error);
    return jsonError("Failed to post announcement", 500);
  }
}
