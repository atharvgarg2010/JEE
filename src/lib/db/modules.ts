import { getPool } from "@/lib/db/postgres";
import type {
  ModuleSet,
  ModuleQuestionLog,
  ModuleDoubtNotification,
  ModuleAnalytics,
  QuestionStatus,
  ModuleDoubtFilters,
  StudentModuleAnalyticsRow,
} from "@/types/modules";

// ============================================================
// Row type helpers
// ============================================================

interface ModuleSetRow {
  id: string;
  chapter_id: string | null;
  subject: string;
  chapter: string;
  module_name: string;
  question_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ModuleQuestionLogRow {
  id: string;
  student_id: string;
  module_set_id: string;
  question_number: number;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
}

interface ModuleDoubtNotifRow {
  id: string;
  student_id: string;
  student_name: string;
  module_set_id: string;
  module_name: string;
  subject: string;
  chapter: string;
  question_number: number;
  status: "doubt" | "revision";
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapModuleSet(row: ModuleSetRow): ModuleSet {
  return {
    id: row.id,
    chapter_id: row.chapter_id ?? null,
    subject: row.subject,
    chapter: row.chapter,
    module_name: row.module_name,
    question_count: row.question_count,
    created_by: row.created_by,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapLog(row: ModuleQuestionLogRow): ModuleQuestionLog {
  return {
    id: row.id,
    student_id: row.student_id,
    module_set_id: row.module_set_id,
    question_number: row.question_number,
    status: row.status,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

// ============================================================
// MODULE SET — ADMIN
// ============================================================

export interface CreateModuleSetInput {
  chapter_id: string;
  module_name: string;
  question_count: number;
  created_by: string;
}

export async function createModuleSet(
  input: CreateModuleSetInput,
): Promise<ModuleSet> {
  const pool = getPool();
  
  // First, verify chapter exists and get subject + chapter names
  const { rows: chapterRows } = await pool.query(
    `SELECT c.id, c.name as chapter_name, s.name as subject_name
     FROM chapters c
     JOIN subjects s ON s.id = c.subject_id
     WHERE c.id = $1 LIMIT 1`,
    [input.chapter_id]
  );
  
  if (!chapterRows[0]) {
    throw new Error("Invalid chapter ID");
  }
  
  const { subject_name, chapter_name } = chapterRows[0];

  const { rows } = await pool.query<ModuleSetRow>(
    `INSERT INTO module_sets (chapter_id, subject, chapter, module_name, question_count, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.chapter_id,
      subject_name,
      chapter_name,
      input.module_name.trim(),
      input.question_count,
      input.created_by,
    ],
  );
  return mapModuleSet(rows[0]);
}

export async function listModuleSets(filters?: {
  subject?: string;
  chapter?: string;
}): Promise<ModuleSet[]> {
  const pool = getPool();
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters?.subject) {
    params.push(filters.subject);
    conditions.push(`subject = $${params.length}`);
  }
  if (filters?.chapter) {
    params.push(filters.chapter);
    conditions.push(`chapter = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query<ModuleSetRow>(
    `SELECT * FROM module_sets ${where}
     ORDER BY subject ASC, chapter ASC, module_name ASC`,
    params,
  );
  return rows.map(mapModuleSet);
}

export async function getModuleSetById(
  id: string,
): Promise<ModuleSet | null> {
  const pool = getPool();
  const { rows } = await pool.query<ModuleSetRow>(
    `SELECT * FROM module_sets WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] ? mapModuleSet(rows[0]) : null;
}

// ============================================================
// MODULE QUESTION LOGS — STUDENT
// ============================================================

/**
 * Upsert a single question status for a student.
 * Validates question_number against the module's question_count.
 * Returns null if the module doesn't exist or question number is out of range.
 */
export async function upsertQuestionLog(
  studentId: string,
  moduleSetId: string,
  questionNumber: number,
  status: QuestionStatus,
): Promise<ModuleQuestionLog | null> {
  const pool = getPool();

  // Validate question number against module
  const { rows: moduleRows } = await pool.query<{ question_count: number }>(
    `SELECT question_count FROM module_sets WHERE id = $1 LIMIT 1`,
    [moduleSetId],
  );
  if (!moduleRows[0]) return null;

  const { question_count } = moduleRows[0];
  if (questionNumber < 1 || questionNumber > question_count) return null;

  const { rows } = await pool.query<ModuleQuestionLogRow>(
    `INSERT INTO module_question_logs
       (student_id, module_set_id, question_number, status)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (student_id, module_set_id, question_number)
     DO UPDATE SET
       status     = EXCLUDED.status,
       updated_at = NOW()
     RETURNING *`,
    [studentId, moduleSetId, questionNumber, status],
  );
  return rows[0] ? mapLog(rows[0]) : null;
}

/**
 * Fetch all logs for a student in a module.
 * Also computes server-side analytics so the client doesn't recompute from scratch.
 */
export async function getLogsForModule(
  studentId: string,
  moduleSetId: string,
): Promise<{ logs: ModuleQuestionLog[]; analytics: ModuleAnalytics; question_count: number }> {
  const pool = getPool();

  const [logsResult, moduleResult] = await Promise.all([
    pool.query<ModuleQuestionLogRow>(
      `SELECT * FROM module_question_logs
       WHERE student_id = $1 AND module_set_id = $2
       ORDER BY question_number ASC`,
      [studentId, moduleSetId],
    ),
    pool.query<{ question_count: number }>(
      `SELECT question_count FROM module_sets WHERE id = $1 LIMIT 1`,
      [moduleSetId],
    ),
  ]);

  const logs = logsResult.rows.map(mapLog);
  const question_count = moduleResult.rows[0]?.question_count ?? 0;

  const analytics = computeAnalytics(logs, question_count);

  return { logs, analytics, question_count };
}

/** Compute analytics counts from a log array + total question count. */
export function computeAnalytics(
  logs: ModuleQuestionLog[],
  questionCount: number,
): ModuleAnalytics {
  const done = logs.filter((l) => l.status === "done").length;
  const doubt = logs.filter((l) => l.status === "doubt").length;
  const revision = logs.filter((l) => l.status === "revision").length;
  const not_done = questionCount - done - doubt - revision;
  const completion_pct =
    questionCount > 0 ? Math.round((done / questionCount) * 100) : 0;

  return { done, doubt, revision, not_done: Math.max(0, not_done), total: questionCount, completion_pct };
}

// ============================================================
// MODULE DOUBT NOTIFICATIONS — STUDENT
// ============================================================

/**
 * Create a doubt notification.
 * Enforces dedup: returns existing unresolved notification if one already exists
 * for the same (student, module, question) — does NOT insert a duplicate row.
 */
export async function createOrGetModuleDoubtNotification(input: {
  student_id: string;
  module_set_id: string;
  question_number: number;
  status: "doubt" | "revision";
}): Promise<{ notification: ModuleDoubtNotification; created: boolean }> {
  const pool = getPool();

  // 1. Resolve exact teacher mapping
  const { rows: teacherResolve } = await pool.query(
    `SELECT bt.teacher_id, u.role
     FROM module_sets ms
     JOIN chapters c ON c.id = ms.chapter_id
     JOIN batch_students bs ON bs.student_id = $1
     JOIN batch_teachers bt ON bt.batch_id = bs.batch_id AND bt.subject_id = c.subject_id
     JOIN users u ON u.id = bt.teacher_id
     WHERE ms.id = $2
     LIMIT 1`,
    [input.student_id, input.module_set_id]
  );

  if (teacherResolve.length === 0) {
    throw new Error("No mapped teacher found for this subject in your batch");
  }

  const teacher = teacherResolve[0];
  if (teacher.role !== "teacher") {
    throw new Error("Mapped user is not a teacher");
  }

  const teacherId = teacher.teacher_id;

  // 2. Check for existing unresolved notification
  const { rows: existing } = await pool.query(
    `SELECT mdn.*, ms.module_name, ms.subject, ms.chapter,
            COALESCE(u.full_name, u.username) AS student_name
     FROM module_doubt_notifications mdn
     JOIN module_sets ms ON ms.id = mdn.module_set_id
     JOIN users u ON u.id = mdn.student_id
     WHERE mdn.student_id = $1
       AND mdn.module_set_id = $2
       AND mdn.question_number = $3
       AND mdn.resolved = FALSE
     LIMIT 1`,
    [input.student_id, input.module_set_id, input.question_number],
  );

  if (existing[0]) {
    return {
      notification: mapDoubtNotif(existing[0] as ModuleDoubtNotifRow),
      created: false,
    };
  }

  // 3. Insert new notification
  const { rows } = await pool.query(
    `WITH inserted AS (
       INSERT INTO module_doubt_notifications
         (student_id, module_set_id, question_number, status, teacher_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *
     )
     SELECT i.*, ms.module_name, ms.subject, ms.chapter,
            COALESCE(u.full_name, u.username) AS student_name
     FROM inserted i
     JOIN module_sets ms ON ms.id = i.module_set_id
     JOIN users u ON u.id = i.student_id`,
    [
      input.student_id,
      input.module_set_id,
      input.question_number,
      input.status,
      teacherId,
    ],
  );

  return {
    notification: mapDoubtNotif(rows[0] as ModuleDoubtNotifRow),
    created: true,
  };
}

// ============================================================
// MODULE DOUBT NOTIFICATIONS — TEACHER
// ============================================================

/**
 * List module doubt notifications visible to a teacher.
 * Defaults to unresolved only, newest first.
 * Filter-ready: accepts ModuleDoubtFilters for future UI exposure.
 */
export async function listModuleDoubtNotifications(
  teacherId: string,
  filters: ModuleDoubtFilters = {},
): Promise<ModuleDoubtNotification[]> {
  const pool = getPool();
  const params: (string | boolean)[] = [teacherId];
  const conditions: string[] = [
    // Teacher sees ONLY notifications strictly routed to them
    `mdn.teacher_id = $1`,
  ];

  // resolved filter (default: unresolved only)
  const resolvedVal = filters.resolved ?? false;
  params.push(resolvedVal);
  conditions.push(`mdn.resolved = $${params.length}`);

  if (filters.subject) {
    params.push(filters.subject);
    conditions.push(`ms.subject = $${params.length}`);
  }
  if (filters.chapter) {
    params.push(filters.chapter);
    conditions.push(`ms.chapter = $${params.length}`);
  }
  if (filters.module_set_id) {
    params.push(filters.module_set_id);
    conditions.push(`mdn.module_set_id = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`mdn.status = $${params.length}`);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await pool.query(
    `SELECT
       mdn.id, mdn.student_id, mdn.module_set_id, mdn.question_number,
       mdn.status, mdn.resolved, mdn.resolved_by, mdn.resolved_at,
       mdn.created_at, mdn.updated_at,
       ms.module_name, ms.subject, ms.chapter,
       COALESCE(u.full_name, u.username) AS student_name
     FROM module_doubt_notifications mdn
     JOIN module_sets ms ON ms.id = mdn.module_set_id
     JOIN users u ON u.id = mdn.student_id
     ${where}
     ORDER BY mdn.resolved ASC, mdn.created_at DESC
     LIMIT 200`,
    params,
  );

  return rows.map((r) => mapDoubtNotif(r as ModuleDoubtNotifRow));
}

/**
 * Resolve a doubt notification.
 * Verifies the teacher has access (same batch as student).
 */
export async function resolveModuleDoubtNotification(
  notifId: string,
  teacherId: string,
): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE module_doubt_notifications
     SET resolved = TRUE, resolved_by = $2, resolved_at = NOW(), updated_at = NOW()
     WHERE id = $1
       AND EXISTS (
         SELECT 1 FROM batch_students bs
         JOIN batch_teachers bt ON bt.batch_id = bs.batch_id
         WHERE bs.student_id = (
           SELECT student_id FROM module_doubt_notifications WHERE id = $1
         )
         AND bt.teacher_id = $2
       )`,
    [notifId, teacherId],
  );
  return (rowCount ?? 0) > 0;
}

function mapDoubtNotif(row: ModuleDoubtNotifRow): ModuleDoubtNotification {
  return {
    id: row.id,
    student_id: row.student_id,
    student_name: row.student_name,
    module_set_id: row.module_set_id,
    module_name: row.module_name,
    subject: row.subject,
    chapter: row.chapter,
    question_number: row.question_number,
    status: row.status,
    resolved: row.resolved,
    resolved_by: row.resolved_by,
    resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function deleteModuleSet(id: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `DELETE FROM module_sets WHERE id = $1`,
    [id],
  );
  return (rowCount ?? 0) > 0;
}

// ============================================================
// TEACHER ANALYTICS — per-student module aggregation
// ============================================================

interface StudentModuleAnalyticsRow_ {
  module_set_id: string;
  subject: string;
  chapter: string;
  module_name: string;
  question_count: string; // pg returns numeric as string
  attempted_questions: string;
  done: string;
  doubt: string;
  revision: string;
  pending: string;
  completion_pct: string | null;
  open_doubts: string;
  last_updated: string | null;
}

/**
 * Returns per-module aggregated analytics for a single student,
 * visible only if the student is in one of the teacher's batches.
 *
 * Sorted: lowest completion first → most doubts → most recently updated.
 * All aggregation happens in SQL — no frontend recomputation needed.
 */
export async function getStudentModuleAnalyticsForTeacher(
  teacherId: string,
  studentId: string,
): Promise<StudentModuleAnalyticsRow[]> {
  const pool = getPool();

  const { rows } = await pool.query<StudentModuleAnalyticsRow_>(
    `WITH doubt_counts AS (
       SELECT module_set_id, COUNT(*) AS open_doubts
       FROM module_doubt_notifications
       WHERE student_id = $2 AND resolved = FALSE
       GROUP BY module_set_id
     )
     SELECT
       ms.id                                                          AS module_set_id,
       ms.subject,
       ms.chapter,
       ms.module_name,
       ms.question_count,

       COUNT(mql.id)                                                  AS attempted_questions,
       COUNT(mql.id) FILTER (WHERE mql.status = 'done')               AS done,
       COUNT(mql.id) FILTER (WHERE mql.status = 'doubt')              AS doubt,
       COUNT(mql.id) FILTER (WHERE mql.status = 'revision')           AS revision,

       -- Pending = total questions not yet marked done/doubt/revision
       ms.question_count - COUNT(mql.id) FILTER (WHERE mql.status IN ('done','doubt','revision')) AS pending,

       -- Completion = any completed-like question (done OR doubt OR revision)
       ROUND(
         COUNT(mql.id) FILTER (WHERE mql.status IN ('done','doubt','revision'))::numeric
         / NULLIF(ms.question_count, 0) * 100,
         1
       )                                                              AS completion_pct,

       COALESCE(dc.open_doubts, 0)                                    AS open_doubts,

       MAX(mql.updated_at)                                            AS last_updated

     FROM module_sets ms
     JOIN module_question_logs mql
       ON mql.module_set_id = ms.id
      AND mql.student_id = $2
     LEFT JOIN doubt_counts dc
       ON dc.module_set_id = ms.id

     -- Teacher access gate: student must be in one of teacher's batches
     WHERE EXISTS (
       SELECT 1
       FROM batch_students bs
       JOIN batch_teachers bt ON bt.batch_id = bs.batch_id
       WHERE bs.student_id = $2
         AND bt.teacher_id = $1
     )

     GROUP BY ms.id, ms.subject, ms.chapter, ms.module_name, ms.question_count, dc.open_doubts

     ORDER BY
       completion_pct ASC NULLS LAST,
       doubt DESC,
       last_updated DESC NULLS LAST`,
    [teacherId, studentId],
  );

  return rows.map((r) => ({
    module_set_id: r.module_set_id,
    subject: r.subject,
    chapter: r.chapter,
    module_name: r.module_name,
    question_count: Number(r.question_count),
    attempted_questions: Number(r.attempted_questions),
    done: Number(r.done),
    doubt: Number(r.doubt),
    revision: Number(r.revision),
    pending: Number(r.pending),
    completion_pct: r.completion_pct !== null ? Number(r.completion_pct) : 0,
    open_doubts: Number(r.open_doubts),
    last_updated: r.last_updated ?? null,
  }));
}

/**
 * Returns per-module aggregated analytics for a single student for admins,
 * with no batch limitations.
 */
export async function getStudentModuleAnalyticsForAdmin(
  studentId: string,
): Promise<StudentModuleAnalyticsRow[]> {
  const pool = getPool();

  const { rows } = await pool.query<StudentModuleAnalyticsRow_>(
    `WITH doubt_counts AS (
       SELECT module_set_id, COUNT(*) AS open_doubts
       FROM module_doubt_notifications
       WHERE student_id = $1 AND resolved = FALSE
       GROUP BY module_set_id
     )
     SELECT
       ms.id                                                          AS module_set_id,
       ms.subject,
       ms.chapter,
       ms.module_name,
       ms.question_count,

       COUNT(mql.id)                                                  AS attempted_questions,
       COUNT(mql.id) FILTER (WHERE mql.status = 'done')               AS done,
       COUNT(mql.id) FILTER (WHERE mql.status = 'doubt')              AS doubt,
       COUNT(mql.id) FILTER (WHERE mql.status = 'revision')           AS revision,

       -- Pending = total questions not yet marked done/doubt/revision
       ms.question_count - COUNT(mql.id) FILTER (WHERE mql.status IN ('done','doubt','revision')) AS pending,

       -- Completion = any completed-like question (done OR doubt OR revision)
       ROUND(
         COUNT(mql.id) FILTER (WHERE mql.status IN ('done','doubt','revision'))::numeric
         / NULLIF(ms.question_count, 0) * 100,
         1
       )                                                              AS completion_pct,

       COALESCE(dc.open_doubts, 0)                                    AS open_doubts,

       MAX(mql.updated_at)                                            AS last_updated

     FROM module_sets ms
     JOIN module_question_logs mql
       ON mql.module_set_id = ms.id
      AND mql.student_id = $1
     LEFT JOIN doubt_counts dc
       ON dc.module_set_id = ms.id

     GROUP BY ms.id, ms.subject, ms.chapter, ms.module_name, ms.question_count, dc.open_doubts

     ORDER BY
       completion_pct ASC NULLS LAST,
       doubt DESC,
       last_updated DESC NULLS LAST`,
    [studentId],
  );

  return rows.map((r) => ({
    module_set_id: r.module_set_id,
    subject: r.subject,
    chapter: r.chapter,
    module_name: r.module_name,
    question_count: Number(r.question_count),
    attempted_questions: Number(r.attempted_questions),
    done: Number(r.done),
    doubt: Number(r.doubt),
    revision: Number(r.revision),
    pending: Number(r.pending),
    completion_pct: r.completion_pct !== null ? Number(r.completion_pct) : 0,
    open_doubts: Number(r.open_doubts),
    last_updated: r.last_updated ?? null,
  }));
}

