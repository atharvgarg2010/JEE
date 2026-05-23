import { getPool } from "@/lib/db/postgres";
import type { QuestionAttempt, QuestionStatus, StudentQuestionProgress } from "@/types/questions";
import type { SolutionViewContext } from "@/lib/constants/questions";

export interface InsertAttemptInput {
  student_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
  doubt_marked?: boolean;
}

function mapAttempt(row: Record<string, unknown>): QuestionAttempt {
  return {
    id: row.id as string,
    student_id: row.student_id as string,
    question_id: row.question_id as string,
    selected_answer: row.selected_answer as string,
    is_correct: row.is_correct as boolean,
    attempt_number: row.attempt_number as number,
    time_taken_seconds: row.time_taken_seconds as number,
    attempted_at: String(row.attempted_at),
    doubt_marked: row.doubt_marked as boolean,
    viewed_solution: row.viewed_solution as boolean,
    reattempt_required: row.reattempt_required as boolean,
    saved_for_revision: (row.saved_for_revision as boolean) ?? false,
  };
}

function mapProgress(row: Record<string, unknown>): StudentQuestionProgress {
  return {
    student_id: row.student_id as string,
    question_id: row.question_id as string,
    status: row.status as QuestionStatus,
    doubt_marked: row.doubt_marked as boolean,
    doubt_resolved: (row.doubt_resolved as boolean) ?? false,
    saved_for_revision: row.saved_for_revision as boolean,
    solution_view_count: row.solution_view_count as number,
    total_attempts: row.total_attempts as number,
    last_attempted_at: row.last_attempted_at
      ? String(row.last_attempted_at)
      : null,
    doubt_marked_at: row.doubt_marked_at
      ? String(row.doubt_marked_at)
      : null,
    revision_saved_at: row.revision_saved_at
      ? String(row.revision_saved_at)
      : null,
  };
}

export function computeStatusFromProgress(
  progress: StudentQuestionProgress | null,
  latestAttempt: QuestionAttempt | null,
): QuestionStatus {
  if (!progress || progress.total_attempts === 0) return "NOT_STARTED";
  if (progress.doubt_marked && !progress.doubt_resolved) return "DOUBT";
  if (progress.saved_for_revision) return "REVISION";
  if (progress.status === "MASTERED") return "MASTERED";
  if (latestAttempt?.is_correct) return "CORRECT";
  if (progress.total_attempts > 0 && !latestAttempt?.is_correct) {
    return progress.status === "REATTEMPT" ? "REATTEMPT" : "WRONG";
  }
  return progress.status;
}

export async function getProgress(
  studentId: string,
  questionId: string,
): Promise<StudentQuestionProgress | null> {
  const { rows } = await getPool().query(
    `SELECT * FROM student_question_progress WHERE student_id = $1 AND question_id = $2`,
    [studentId, questionId],
  );
  return rows[0] ? mapProgress(rows[0]) : null;
}

export async function getLatestAttempt(
  studentId: string,
  questionId: string,
): Promise<QuestionAttempt | null> {
  const { rows } = await getPool().query(
    `SELECT * FROM question_attempts
     WHERE student_id = $1 AND question_id = $2
     ORDER BY attempt_number DESC LIMIT 1`,
    [studentId, questionId],
  );
  return rows[0] ? mapAttempt(rows[0]) : null;
}

/** @deprecated use getLatestAttempt */
export const getAttempt = getLatestAttempt;

export async function getAttemptHistory(
  studentId: string,
  questionId: string,
): Promise<QuestionAttempt[]> {
  const { rows } = await getPool().query(
    `SELECT * FROM question_attempts
     WHERE student_id = $1 AND question_id = $2
     ORDER BY attempt_number ASC`,
    [studentId, questionId],
  );
  return rows.map(mapAttempt);
}

export async function getNextAttemptNumber(
  studentId: string,
  questionId: string,
): Promise<number> {
  const { rows } = await getPool().query(
    `SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next
     FROM question_attempts WHERE student_id = $1 AND question_id = $2`,
    [studentId, questionId],
  );
  return (rows[0]?.next as number) ?? 1;
}

export async function insertAttempt(
  input: InsertAttemptInput,
): Promise<{ attempt: QuestionAttempt; progress: StudentQuestionProgress }> {
  const pool = getPool();
  const attemptNumber = await getNextAttemptNumber(
    input.student_id,
    input.question_id,
  );

  const { rows: attemptRows } = await pool.query(
    `INSERT INTO question_attempts (
      student_id, question_id, selected_answer, is_correct, attempt_number,
      attempts_count, time_taken_seconds, doubt_marked, viewed_solution,
      reattempt_required, saved_for_revision
    ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,FALSE,$8,FALSE)
    RETURNING *`,
    [
      input.student_id,
      input.question_id,
      input.selected_answer,
      input.is_correct,
      attemptNumber,
      input.time_taken_seconds,
      input.doubt_marked ?? false,
      !input.is_correct,
    ],
  );

  const attempt = mapAttempt(attemptRows[0]);
  const existing = await getProgress(input.student_id, input.question_id);

  let status: QuestionStatus = input.is_correct ? "CORRECT" : "WRONG";
  if (input.is_correct && !input.doubt_marked && !existing?.saved_for_revision) {
    status = "MASTERED";
  }
  if (input.doubt_marked) status = "DOUBT";
  if (existing?.saved_for_revision) status = "REVISION";

  const { rows: progRows } = await pool.query(
    `INSERT INTO student_question_progress (
      student_id, question_id, status, doubt_marked, saved_for_revision,
      solution_view_count, total_attempts, last_attempted_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
    ON CONFLICT (student_id, question_id) DO UPDATE SET
      status = EXCLUDED.status,
      doubt_marked = COALESCE(EXCLUDED.doubt_marked, student_question_progress.doubt_marked),
      total_attempts = student_question_progress.total_attempts + 1,
      last_attempted_at = NOW(),
      updated_at = NOW()
    RETURNING *`,
    [
      input.student_id,
      input.question_id,
      status,
      input.doubt_marked ?? existing?.doubt_marked ?? false,
      existing?.saved_for_revision ?? false,
      existing?.solution_view_count ?? 0,
      1,
    ],
  );

  return { attempt, progress: mapProgress(progRows[0]) };
}

export async function updateProgressFlags(
  studentId: string,
  questionId: string,
  flags: Partial<{
    doubt_marked: boolean;
    doubt_resolved: boolean;
    saved_for_revision: boolean;
    status: QuestionStatus;
  }>,
): Promise<StudentQuestionProgress> {
  const existing = await getProgress(studentId, questionId);
  const latest = await getLatestAttempt(studentId, questionId);

  let status = flags.status ?? existing?.status ?? "NOT_STARTED";
  const doubt = flags.doubt_marked ?? existing?.doubt_marked ?? false;
  const doubtResolved =
    flags.doubt_resolved ?? existing?.doubt_resolved ?? false;
  const revision = flags.saved_for_revision ?? existing?.saved_for_revision ?? false;

  if (doubt && !doubtResolved) status = "DOUBT";
  else if (revision) status = "REVISION";
  else if (flags.status === "REATTEMPT") status = "REATTEMPT";
  else if (latest?.is_correct && !revision) status = "MASTERED";
  else if (latest && !latest.is_correct) status = "WRONG";

  const { rows } = await getPool().query(
    `INSERT INTO student_question_progress (
      student_id, question_id, status, doubt_marked, doubt_resolved,
      saved_for_revision, solution_view_count, total_attempts,
      doubt_marked_at, revision_saved_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
      CASE WHEN $4 THEN NOW() ELSE NULL END,
      CASE WHEN $6 THEN NOW() ELSE NULL END)
    ON CONFLICT (student_id, question_id) DO UPDATE SET
      status = $3,
      doubt_marked = $4,
      doubt_resolved = $5,
      saved_for_revision = $6,
      doubt_marked_at = CASE
        WHEN $4 AND student_question_progress.doubt_marked_at IS NULL THEN NOW()
        WHEN NOT $4 THEN NULL
        ELSE student_question_progress.doubt_marked_at
      END,
      revision_saved_at = CASE
        WHEN $6 AND student_question_progress.revision_saved_at IS NULL THEN NOW()
        WHEN NOT $6 THEN NULL
        ELSE student_question_progress.revision_saved_at
      END,
      updated_at = NOW()
    RETURNING *`,
    [
      studentId,
      questionId,
      status,
      doubt,
      doubtResolved,
      revision,
      existing?.solution_view_count ?? 0,
      existing?.total_attempts ?? (latest ? 1 : 0),
    ],
  );

  return mapProgress(rows[0]);
}

export async function recordSolutionView(
  studentId: string,
  questionId: string,
  context: SolutionViewContext,
  attemptNumberAtView?: number,
): Promise<{ viewCount: number }> {
  const pool = getPool();
  const latest = await getLatestAttempt(studentId, questionId);
  const attemptNum = attemptNumberAtView ?? latest?.attempt_number ?? null;

  await pool.query(
    `INSERT INTO question_solution_views (
      student_id, question_id, attempt_number_at_view, view_context
    ) VALUES ($1,$2,$3,$4)`,
    [studentId, questionId, attemptNum, context],
  );

  const { rows } = await pool.query(
    `INSERT INTO student_question_progress (
      student_id, question_id, status, solution_view_count, total_attempts
    ) VALUES ($1,$2,'NOT_STARTED',1,0)
    ON CONFLICT (student_id, question_id) DO UPDATE SET
      solution_view_count = student_question_progress.solution_view_count + 1,
      updated_at = NOW()
    RETURNING solution_view_count`,
    [studentId, questionId],
  );

  if (latest) {
    await pool.query(
      `UPDATE question_attempts SET viewed_solution = TRUE
       WHERE student_id = $1 AND question_id = $2 AND attempt_number = $3`,
      [studentId, questionId, latest.attempt_number],
    );
  }

  return { viewCount: rows[0].solution_view_count as number };
}

export async function getSolutionViews(
  studentId: string,
  questionId: string,
) {
  const { rows } = await getPool().query(
    `SELECT id, attempt_number_at_view, view_context, viewed_at
     FROM question_solution_views
     WHERE student_id = $1 AND question_id = $2
     ORDER BY viewed_at ASC`,
    [studentId, questionId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    attempt_number_at_view: r.attempt_number_at_view as number | null,
    view_context: r.view_context as string,
    viewed_at: String(r.viewed_at),
  }));
}
