import { getPool } from "@/lib/db/postgres";

// ============================================================
// TYPES
// ============================================================

export interface AdminDashboardStats {
  total_batches: number;
  active_batches: number;
  total_students: number;
  total_teachers: number;
  total_questions: number;
  total_doubts_unresolved: number;
  total_attempts: number;
}

export interface BatchPerformanceStat {
  batch_id: string;
  batch_name: string;
  batch_code: string;
  student_count: number;
  avg_accuracy: number | null;
  total_attempts: number;
  doubts_pending: number;
  teacher_count: number;
}

export interface TeacherPerformanceStat {
  teacher_id: string;
  teacher_name: string;
  subject: string | null;
  batches_count: number;
  students_count: number;
  questions_authored: number;
  avg_student_accuracy: number | null;
  unresolved_doubts: number;
}

export interface StudentRanking {
  student_id: string;
  student_name: string;
  batch_name: string | null;
  batch_code: string | null;
  accuracy: number;
  questions_attempted: number;
  streak: number;
  rank: number;
}

export interface TeacherLoad {
  teacher_id: string;
  teacher_name: string;
  subject: string | null;
  total_students: number;
  batches: string[];
  unresolved_doubts: number;
  questions_authored: number;
}

export interface CrossBatchWeakChapter {
  chapter_id: string;
  chapter_name: string;
  subject_name: string;
  subject_slug: string;
  avg_accuracy: number;
  total_doubts: number;
  total_mistakes: number;
  students_attempted: number;
}

// ============================================================
// QUERIES
// ============================================================

/** Platform-wide KPI summary for admin dashboard */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT
       COUNT(DISTINCT b.id)::int AS total_batches,
       COUNT(DISTINCT b.id) FILTER (WHERE b.is_active)::int AS active_batches,
       COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'student')::int AS total_students,
       COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher')::int AS total_teachers,
       COUNT(DISTINCT q.id)::int AS total_questions,
       COUNT(DISTINCT sqp.question_id) FILTER (
         WHERE sqp.doubt_marked AND NOT COALESCE(sqp.doubt_resolved, FALSE)
       )::int AS total_doubts_unresolved,
       COUNT(DISTINCT qa.id)::int AS total_attempts
     FROM users u
     LEFT JOIN batches b ON TRUE
     LEFT JOIN questions q ON q.teacher_id = u.id AND u.role = 'teacher'
     LEFT JOIN student_question_progress sqp ON sqp.student_id = u.id AND u.role = 'student'
     LEFT JOIN question_attempts qa ON qa.student_id = u.id AND u.role = 'student'`
  );

  const r = rows[0];
  return {
    total_batches: r.total_batches as number,
    active_batches: r.active_batches as number,
    total_students: r.total_students as number,
    total_teachers: r.total_teachers as number,
    total_questions: r.total_questions as number,
    total_doubts_unresolved: r.total_doubts_unresolved as number,
    total_attempts: r.total_attempts as number,
  };
}

/** Per-batch performance metrics */
export async function getBatchPerformanceStats(): Promise<BatchPerformanceStat[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       b.id AS batch_id,
       b.name AS batch_name,
       b.code AS batch_code,
       COUNT(DISTINCT bs.student_id)::int AS student_count,
       COUNT(DISTINCT bt.teacher_id)::int AS teacher_count,
       COALESCE(
         ROUND(
           AVG(
             CASE WHEN agg.total > 0
                  THEN (agg.correct::float / agg.total) * 100
             END
           )
         )::int, 0
       ) AS avg_accuracy,
       COALESCE(SUM(agg.total), 0)::int AS total_attempts,
       COUNT(DISTINCT sqp.question_id) FILTER (
         WHERE sqp.doubt_marked AND NOT COALESCE(sqp.doubt_resolved, FALSE)
       )::int AS doubts_pending
     FROM batches b
     LEFT JOIN batch_students bs ON bs.batch_id = b.id
     LEFT JOIN batch_teachers bt ON bt.batch_id = b.id
     LEFT JOIN (
       SELECT
         qa.student_id,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE qa.is_correct)::int AS correct
       FROM question_attempts qa
       GROUP BY qa.student_id
     ) agg ON agg.student_id = bs.student_id
     LEFT JOIN student_question_progress sqp ON sqp.student_id = bs.student_id
     WHERE b.is_active = TRUE
     GROUP BY b.id, b.name, b.code
     ORDER BY student_count DESC`
  );

  return rows.map((r) => ({
    batch_id: r.batch_id as string,
    batch_name: r.batch_name as string,
    batch_code: r.batch_code as string,
    student_count: r.student_count as number,
    teacher_count: r.teacher_count as number,
    avg_accuracy: r.avg_accuracy as number | null,
    total_attempts: r.total_attempts as number,
    doubts_pending: r.doubts_pending as number,
  }));
}

/** Teacher performance stats — questions authored, student outcomes, load */
export async function getTeacherPerformanceStats(): Promise<TeacherPerformanceStat[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       u.id AS teacher_id,
       COALESCE(u.full_name, u.username) AS teacher_name,
       u.subject,
       COUNT(DISTINCT bt.batch_id)::int AS batches_count,
       COUNT(DISTINCT bs.student_id)::int AS students_count,
       COUNT(DISTINCT q.id)::int AS questions_authored,
       COALESCE(
         ROUND(
           AVG(
             CASE WHEN agg.total > 0
                  THEN (agg.correct::float / agg.total) * 100
             END
           )
         )::int, 0
       ) AS avg_student_accuracy,
       COUNT(DISTINCT sqp.question_id) FILTER (
         WHERE sqp.doubt_marked AND NOT COALESCE(sqp.doubt_resolved, FALSE)
       )::int AS unresolved_doubts
     FROM users u
     LEFT JOIN batch_teachers bt ON bt.teacher_id = u.id
     LEFT JOIN batch_students bs ON bs.batch_id = bt.batch_id
     LEFT JOIN questions q ON q.teacher_id = u.id
     LEFT JOIN (
       SELECT
         qa.student_id,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE qa.is_correct)::int AS correct
       FROM question_attempts qa
       GROUP BY qa.student_id
     ) agg ON agg.student_id = bs.student_id
     LEFT JOIN student_question_progress sqp ON sqp.student_id = bs.student_id
     WHERE u.role = 'teacher'
     GROUP BY u.id, u.full_name, u.username, u.subject
     ORDER BY students_count DESC`
  );

  return rows.map((r) => ({
    teacher_id: r.teacher_id as string,
    teacher_name: r.teacher_name as string,
    subject: r.subject as string | null,
    batches_count: r.batches_count as number,
    students_count: r.students_count as number,
    questions_authored: r.questions_authored as number,
    avg_student_accuracy: r.avg_student_accuracy as number | null,
    unresolved_doubts: r.unresolved_doubts as number,
  }));
}

/** Student rankings cross-batch — top performers by accuracy */
export async function getStudentRankings(limit = 50): Promise<StudentRanking[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       u.id AS student_id,
       COALESCE(u.full_name, u.username) AS student_name,
       b.name AS batch_name,
       b.code AS batch_code,
       COALESCE(
         ROUND(
           (COUNT(*) FILTER (WHERE qa.is_correct)::float
            / NULLIF(COUNT(qa.id), 0)) * 100
         )::int, 0
       ) AS accuracy,
       COUNT(DISTINCT qa.question_id)::int AS questions_attempted,
       COALESCE(streak.days, 0)::int AS streak
     FROM users u
     LEFT JOIN batch_students bs ON bs.student_id = u.id
     LEFT JOIN batches b ON b.id = bs.batch_id
     LEFT JOIN question_attempts qa ON qa.student_id = u.id
     LEFT JOIN LATERAL (
       SELECT COUNT(DISTINCT (qa2.attempted_at AT TIME ZONE 'UTC')::date)::int AS days
       FROM question_attempts qa2
       WHERE qa2.student_id = u.id
         AND qa2.attempted_at >= NOW() - INTERVAL '30 days'
     ) streak ON TRUE
     WHERE u.role = 'student'
     GROUP BY u.id, u.full_name, u.username, b.name, b.code, streak.days
     HAVING COUNT(qa.id) >= 3
     ORDER BY accuracy DESC, questions_attempted DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map((r, i) => ({
    student_id: r.student_id as string,
    student_name: r.student_name as string,
    batch_name: r.batch_name as string | null,
    batch_code: r.batch_code as string | null,
    accuracy: r.accuracy as number,
    questions_attempted: r.questions_attempted as number,
    streak: r.streak as number,
    rank: i + 1,
  }));
}

/** Weak chapters cross-platform or filtered by batch */
export async function getWeakChaptersAcrossBatches(
  batchId?: string
): Promise<CrossBatchWeakChapter[]> {
  const pool = getPool();
  const params: unknown[] = [];
  let batchFilter = "";

  if (batchId) {
    batchFilter = `AND bs.batch_id = $1`;
    params.push(batchId);
  }

  const { rows } = await pool.query(
    `SELECT
       c.id AS chapter_id,
       c.name AS chapter_name,
       s.name AS subject_name,
       s.slug AS subject_slug,
       COALESCE(
         ROUND(
           AVG(
             CASE WHEN agg.total > 0
                  THEN (agg.correct::float / agg.total) * 100
             END
           )
         )::int, 0
       ) AS avg_accuracy,
       COALESCE(SUM(agg.doubts), 0)::int AS total_doubts,
       COALESCE(SUM(agg.mistakes), 0)::int AS total_mistakes,
       COUNT(DISTINCT agg.student_id)::int AS students_attempted
     FROM chapters c
     JOIN subjects s ON s.id = c.subject_id
     LEFT JOIN questions q ON q.chapter_id = c.id
     LEFT JOIN (
       SELECT
         qa.student_id,
         q2.chapter_id,
         COUNT(qa.id)::int AS total,
         COUNT(qa.id) FILTER (WHERE qa.is_correct)::int AS correct,
         COUNT(sqp.question_id) FILTER (
           WHERE sqp.doubt_marked AND NOT COALESCE(sqp.doubt_resolved, FALSE)
         )::int AS doubts,
         COUNT(sqp.question_id) FILTER (WHERE sqp.status = 'WRONG')::int AS mistakes
       FROM question_attempts qa
       JOIN questions q2 ON q2.id = qa.question_id
       LEFT JOIN batch_students bs ON bs.student_id = qa.student_id
       LEFT JOIN student_question_progress sqp
         ON sqp.student_id = qa.student_id AND sqp.question_id = qa.question_id
       WHERE TRUE ${batchFilter}
       GROUP BY qa.student_id, q2.chapter_id
     ) agg ON agg.chapter_id = c.id
     GROUP BY c.id, c.name, s.name, s.slug
     HAVING COUNT(DISTINCT agg.student_id) > 0
     ORDER BY avg_accuracy ASC, total_doubts DESC
     LIMIT 20`,
    params
  );

  return rows.map((r) => ({
    chapter_id: r.chapter_id as string,
    chapter_name: r.chapter_name as string,
    subject_name: r.subject_name as string,
    subject_slug: r.subject_slug as string,
    avg_accuracy: r.avg_accuracy as number,
    total_doubts: r.total_doubts as number,
    total_mistakes: r.total_mistakes as number,
    students_attempted: r.students_attempted as number,
  }));
}

/** Teacher load distribution */
export async function getTeacherLoadDistribution(): Promise<TeacherLoad[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       u.id AS teacher_id,
       COALESCE(u.full_name, u.username) AS teacher_name,
       u.subject,
       COUNT(DISTINCT bs.student_id)::int AS total_students,
       ARRAY_AGG(DISTINCT b.name) FILTER (WHERE b.name IS NOT NULL) AS batches,
       COUNT(DISTINCT q.id)::int AS questions_authored,
       COUNT(DISTINCT sqp.question_id) FILTER (
         WHERE sqp.doubt_marked AND NOT COALESCE(sqp.doubt_resolved, FALSE)
       )::int AS unresolved_doubts
     FROM users u
     LEFT JOIN batch_teachers bt ON bt.teacher_id = u.id
     LEFT JOIN batches b ON b.id = bt.batch_id
     LEFT JOIN batch_students bs ON bs.batch_id = bt.batch_id
     LEFT JOIN questions q ON q.teacher_id = u.id
     LEFT JOIN student_question_progress sqp ON sqp.student_id = bs.student_id
     WHERE u.role = 'teacher'
     GROUP BY u.id, u.full_name, u.username, u.subject
     ORDER BY total_students DESC`
  );

  return rows.map((r) => ({
    teacher_id: r.teacher_id as string,
    teacher_name: r.teacher_name as string,
    subject: r.subject as string | null,
    total_students: r.total_students as number,
    batches: (r.batches as string[] | null) ?? [],
    questions_authored: r.questions_authored as number,
    unresolved_doubts: r.unresolved_doubts as number,
  }));
}
