import { getPool } from "@/lib/db/postgres";
import type { TeacherNotification } from "@/types/dashboard";

export async function createTeacherNotification(input: {
  student_id: string;
  teacher_id: string;
  question_id: string;
  message: string;
  chapter_name?: string;
}): Promise<TeacherNotification> {
  const { rows } = await getPool().query(
    `INSERT INTO teacher_notifications (
      student_id, teacher_id, question_id, message, chapter_name
    ) VALUES ($1,$2,$3,$4,$5)
    RETURNING *`,
    [
      input.student_id,
      input.teacher_id,
      input.question_id,
      input.message,
      input.chapter_name ?? null,
    ],
  );

  const { rows: userRows } = await getPool().query(
    `SELECT full_name, username FROM users WHERE id = $1`,
    [input.student_id],
  );
  const u = userRows[0];

  return {
    id: rows[0].id as string,
    student_id: input.student_id,
    student_name: (u?.full_name as string) ?? (u?.username as string) ?? "Student",
    teacher_id: input.teacher_id,
    question_id: input.question_id,
    message: input.message,
    chapter_name: input.chapter_name ?? null,
    read: false,
    created_at: String(rows[0].created_at),
  };
}

export async function listTeacherNotifications(
  teacherId: string,
): Promise<TeacherNotification[]> {
  const { rows } = await getPool().query(
    `SELECT
      n.id, n.student_id, n.teacher_id, n.question_id, n.message,
      n.chapter_name, n.read, n.created_at,
      COALESCE(u.full_name, u.username) AS student_name
     FROM teacher_notifications n
     JOIN users u ON u.id = n.student_id
     WHERE n.teacher_id = $1
     ORDER BY n.read ASC, n.created_at DESC
     LIMIT 100`,
    [teacherId],
  );

  return rows.map((r) => ({
    id: r.id as string,
    student_id: r.student_id as string,
    student_name: r.student_name as string,
    teacher_id: r.teacher_id as string,
    question_id: r.question_id as string,
    message: r.message as string,
    chapter_name: r.chapter_name as string | null,
    read: r.read as boolean,
    created_at: String(r.created_at),
  }));
}

export async function markNotificationRead(
  notificationId: string,
  teacherId: string,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `UPDATE teacher_notifications SET read = TRUE
     WHERE id = $1 AND teacher_id = $2`,
    [notificationId, teacherId],
  );
  return (rowCount ?? 0) > 0;
}

export async function countUnreadNotifications(
  teacherId: string,
): Promise<number> {
  const { rows } = await getPool().query(
    `SELECT COUNT(*)::int AS c FROM teacher_notifications
     WHERE teacher_id = $1 AND NOT read`,
    [teacherId],
  );
  return rows[0]?.c ?? 0;
}
