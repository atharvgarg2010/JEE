import { isTeacherUser, requireTeacher } from "@/lib/auth/teacher";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { getPool } from "@/lib/db/postgres";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createAnnouncementSchema = z.object({
  batch_target: z.enum(["specific", "all"]),
  batch_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
}).refine(
  (d) => d.batch_target === "all" || (d.batch_target === "specific" && !!d.batch_id),
  { message: "batch_id is required when batch_target is 'specific'" }
);

/**
 * GET /api/teacher/announcements
 * Returns announcements posted by this teacher with read-tracking analytics.
 */
export async function GET() {
  const user = await requireTeacher();
  if (!isTeacherUser(user)) return user;

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
         COUNT(DISTINCT bs.student_id)::int  AS total_students,
         COUNT(DISTINCT ar.student_id)::int  AS read_count
       FROM announcements a
       JOIN batches b ON b.id = a.batch_id
       LEFT JOIN batch_students bs ON bs.batch_id = a.batch_id
       LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id
       WHERE a.teacher_id = $1
       GROUP BY a.id, b.name, b.code
       ORDER BY a.created_at DESC
       LIMIT 100`,
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
      created_at: String(r.created_at),
      total_students: r.total_students as number,
      read_count: r.read_count as number,
    }));

    return jsonSuccess({ announcements });
  } catch (error) {
    console.error("[teacher/announcements GET]", error);
    return jsonError("Failed to load announcements", 500);
  }
}

/**
 * POST /api/teacher/announcements
 * Post a new announcement to one specific batch or all assigned batches.
 * Server-side validates teacher is assigned to every targeted batch.
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
    const { batch_target, batch_id, title, body: msgBody, priority } = parsed.data;

    // ----- resolve which batch IDs to target -----
    let targetBatchIds: string[];

    if (batch_target === "all") {
      // Fetch all batches this teacher is assigned to
      const { rows: batchRows } = await pool.query<{ batch_id: string }>(
        `SELECT DISTINCT batch_id FROM batch_teachers WHERE teacher_id = $1`,
        [user.id]
      );
      if (batchRows.length === 0) {
        return jsonError("You are not assigned to any batches", 403);
      }
      targetBatchIds = batchRows.map((r) => r.batch_id);
    } else {
      // specific batch — verify teacher is assigned
      const check = await pool.query(
        `SELECT 1 FROM batch_teachers WHERE batch_id = $1 AND teacher_id = $2 LIMIT 1`,
        [batch_id, user.id]
      );
      if (check.rows.length === 0) {
        return jsonError("You are not assigned to this batch", 403);
      }
      targetBatchIds = [batch_id!];
    }

    // ----- insert one row per batch in a transaction -----
    const client = await pool.connect();
    const insertedIds: string[] = [];
    try {
      await client.query("BEGIN");
      for (const bId of targetBatchIds) {
        const { rows } = await client.query<{ id: string }>(
          `INSERT INTO announcements (teacher_id, batch_id, title, body, priority)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [user.id, bId, title, msgBody, priority]
        );
        insertedIds.push(rows[0].id);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return jsonSuccess({ inserted: insertedIds.length, ids: insertedIds }, 201);
  } catch (error) {
    console.error("[teacher/announcements POST]", error);
    return jsonError("Failed to post announcement", 500);
  }
}
