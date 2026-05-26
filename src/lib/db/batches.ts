import { getPool } from "./postgres";

// ============================================================
// TYPES
// ============================================================

export interface BatchRow {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BatchWithStats extends BatchRow {
  student_count: number;
  teacher_count: number;
  avg_accuracy: number | null;
  doubts_pending: number;
}

export interface BatchTeacherRow {
  teacher_id: string;
  teacher_name: string;
  teacher_username: string;
  subject_id: string;
  subject_name: string;
  subject_slug: string;
  assigned_at: string;
}

export interface BatchStudentRow {
  student_id: string;
  student_name: string;
  student_username: string;
  roll_number: string | null;
  enrolled_at: string;
}

export interface DoubtRouteResult {
  teacherId: string;
  chapterName: string;
  batchId: string | null;
  /** true = routed via batch mapping, false = fell back to question author */
  usedBatchRoute: boolean;
}

// ============================================================
// ENROLLMENT
// ============================================================

/**
 * Enrolls a student in a batch by batch code.
 * If the batch doesn't exist, it creates it automatically.
 * If the student is already in another batch, moves them (upsert semantics).
 * Returns the batch UUID.
 *
 * Business rule: one student → exactly one batch.
 * After migration 012, the UNIQUE (student_id) constraint enforces this at DB level.
 */
export async function enrollStudentInBatch(
  studentId: string,
  batchCode: string
): Promise<string> {
  const pool = getPool();
  const normalizedCode = batchCode.trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error("Batch code cannot be empty");
  }

  // 1. Get or create batch
  let batchId: string;
  const batchRes = await pool.query<{ id: string }>(
    `SELECT id FROM batches WHERE code = $1`,
    [normalizedCode]
  );

  if (batchRes.rows.length > 0) {
    batchId = batchRes.rows[0].id;
  } else {
    const createRes = await pool.query<{ id: string }>(
      `INSERT INTO batches (name, code, description)
       VALUES ($1, $2, 'Automatically created during student signup')
       RETURNING id`,
      [normalizedCode, normalizedCode]
    );
    batchId = createRes.rows[0].id;
  }

  // 2. Enroll student — upsert: if constraint exists (post-012), DO UPDATE moves student
  // If constraint doesn't exist yet (pre-012), DO NOTHING is safe
  await pool.query(
    `INSERT INTO batch_students (batch_id, student_id)
     VALUES ($1, $2)
     ON CONFLICT (student_id) DO UPDATE SET batch_id = EXCLUDED.batch_id, enrolled_at = NOW()
     ON CONFLICT (batch_id, student_id) DO NOTHING`,
    [batchId, studentId]
  );

  return batchId;
}

/**
 * Moves a student from their current batch to a new batch.
 * Admin-only operation. Updates both batch_students and users.batch_code.
 */
export async function reassignStudentBatch(
  studentId: string,
  newBatchId: string
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get new batch code for syncing users.batch_code
    const batchRes = await client.query<{ code: string }>(
      `SELECT code FROM batches WHERE id = $1`,
      [newBatchId]
    );
    if (batchRes.rows.length === 0) {
      throw new Error(`Batch ${newBatchId} not found`);
    }
    const newBatchCode = batchRes.rows[0].code;

    // Upsert batch_students
    await client.query(
      `INSERT INTO batch_students (batch_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id) DO UPDATE SET batch_id = EXCLUDED.batch_id, enrolled_at = NOW()`,
      [newBatchId, studentId]
    );

    // Keep users.batch_code in sync (legacy compatibility)
    await client.query(
      `UPDATE users SET batch_code = $1 WHERE id = $2 AND role = 'student'`,
      [newBatchCode, studentId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================
// TEACHER ASSIGNMENT
// ============================================================

/**
 * Assigns a teacher to a batch for a specific subject.
 * Enforces one teacher per subject per batch via UNIQUE (batch_id, subject_id).
 * If a teacher is already assigned for that subject, replaces them.
 */
export async function assignTeacherToBatch(
  batchId: string,
  teacherId: string,
  subjectId: string
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO batch_teachers (batch_id, teacher_id, subject_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (batch_id, subject_id)
     DO UPDATE SET teacher_id = EXCLUDED.teacher_id, assigned_at = NOW()`,
    [batchId, teacherId, subjectId]
  );
}

/**
 * Removes a teacher from a batch for a specific subject.
 */
export async function removeTeacherFromBatch(
  batchId: string,
  subjectId: string
): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `DELETE FROM batch_teachers WHERE batch_id = $1 AND subject_id = $2`,
    [batchId, subjectId]
  );
  return (rowCount ?? 0) > 0;
}

// ============================================================
// BATCH QUERIES
// ============================================================

/**
 * Returns all batches with summary statistics.
 * Used by: admin dashboard, teacher batch overview.
 */
export async function listBatchesWithStats(): Promise<BatchWithStats[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       b.id, b.name, b.code, b.description, b.is_active, b.created_at,
       COUNT(DISTINCT bs.student_id)::int AS student_count,
       COUNT(DISTINCT bt.teacher_id)::int AS teacher_count,
       ROUND(
         AVG(
           CASE WHEN a.total_attempts > 0
                THEN (a.correct_attempts::float / a.total_attempts) * 100
           END
         )
       )::int AS avg_accuracy,
       COUNT(DISTINCT sqp.question_id) FILTER (
         WHERE sqp.doubt_marked AND NOT COALESCE(sqp.doubt_resolved, FALSE)
       )::int AS doubts_pending
     FROM batches b
     LEFT JOIN batch_students bs ON bs.batch_id = b.id
     LEFT JOIN batch_teachers bt ON bt.batch_id = b.id
     LEFT JOIN (
       SELECT
         qa.student_id,
         COUNT(*)::int AS total_attempts,
         COUNT(*) FILTER (WHERE qa.is_correct)::int AS correct_attempts
       FROM question_attempts qa
       GROUP BY qa.student_id
     ) a ON a.student_id = bs.student_id
     LEFT JOIN student_question_progress sqp ON sqp.student_id = bs.student_id
     GROUP BY b.id, b.name, b.code, b.description, b.is_active, b.created_at
     ORDER BY b.is_active DESC, b.created_at DESC`
  );

  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    code: r.code as string,
    description: r.description as string | null,
    is_active: r.is_active as boolean,
    created_at: String(r.created_at),
    student_count: r.student_count as number,
    teacher_count: r.teacher_count as number,
    avg_accuracy: r.avg_accuracy as number | null,
    doubts_pending: r.doubts_pending as number,
  }));
}

/**
 * Returns a single batch's details with teachers and summary stats.
 */
export async function getBatchById(batchId: string): Promise<BatchWithStats | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       b.id, b.name, b.code, b.description, b.is_active, b.created_at,
       COUNT(DISTINCT bs.student_id)::int AS student_count,
       COUNT(DISTINCT bt.teacher_id)::int AS teacher_count,
       0::int AS avg_accuracy,
       0::int AS doubts_pending
     FROM batches b
     LEFT JOIN batch_students bs ON bs.batch_id = b.id
     LEFT JOIN batch_teachers bt ON bt.batch_id = b.id
     WHERE b.id = $1
     GROUP BY b.id, b.name, b.code, b.description, b.is_active, b.created_at`,
    [batchId]
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id as string,
    name: r.name as string,
    code: r.code as string,
    description: r.description as string | null,
    is_active: r.is_active as boolean,
    created_at: String(r.created_at),
    student_count: r.student_count as number,
    teacher_count: r.teacher_count as number,
    avg_accuracy: r.avg_accuracy as number | null,
    doubts_pending: r.doubts_pending as number,
  };
}

/**
 * Returns the 3 teachers (Physics, Chemistry, Maths) assigned to a batch.
 */
export async function getBatchTeachers(batchId: string): Promise<BatchTeacherRow[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       bt.teacher_id,
       COALESCE(u.full_name, u.username) AS teacher_name,
       u.username AS teacher_username,
       bt.subject_id,
       s.name AS subject_name,
       s.slug AS subject_slug,
       bt.assigned_at
     FROM batch_teachers bt
     JOIN users u ON u.id = bt.teacher_id
     JOIN subjects s ON s.id = bt.subject_id
     WHERE bt.batch_id = $1
     ORDER BY s.name`,
    [batchId]
  );
  return rows.map((r) => ({
    teacher_id: r.teacher_id as string,
    teacher_name: r.teacher_name as string,
    teacher_username: r.teacher_username as string,
    subject_id: r.subject_id as string,
    subject_name: r.subject_name as string,
    subject_slug: r.subject_slug as string,
    assigned_at: String(r.assigned_at),
  }));
}

/**
 * Returns students enrolled in a batch, paginated.
 */
export async function getBatchStudents(
  batchId: string,
  page = 1,
  limit = 50
): Promise<{ students: BatchStudentRow[]; total: number }> {
  const pool = getPool();
  const offset = (page - 1) * limit;

  const countRes = await pool.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM batch_students WHERE batch_id = $1`,
    [batchId]
  );
  const total = countRes.rows[0]?.total ?? 0;

  const { rows } = await pool.query(
    `SELECT
       bs.student_id,
       COALESCE(u.full_name, u.username) AS student_name,
       u.username AS student_username,
       u.roll_number,
       bs.enrolled_at
     FROM batch_students bs
     JOIN users u ON u.id = bs.student_id
     WHERE bs.batch_id = $1
     ORDER BY bs.enrolled_at DESC
     LIMIT $2 OFFSET $3`,
    [batchId, limit, offset]
  );

  return {
    total,
    students: rows.map((r) => ({
      student_id: r.student_id as string,
      student_name: r.student_name as string,
      student_username: r.student_username as string,
      roll_number: r.roll_number as string | null,
      enrolled_at: String(r.enrolled_at),
    })),
  };
}

/**
 * Returns the batches a teacher is assigned to (across all subjects).
 */
export async function getTeacherBatches(teacherId: string): Promise<BatchWithStats[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       b.id, b.name, b.code, b.description, b.is_active, b.created_at,
       COUNT(DISTINCT bs.student_id)::int AS student_count,
       COUNT(DISTINCT bt2.teacher_id)::int AS teacher_count,
       0::int AS avg_accuracy,
       COUNT(DISTINCT sqp.question_id) FILTER (
         WHERE sqp.doubt_marked AND NOT COALESCE(sqp.doubt_resolved, FALSE)
       )::int AS doubts_pending
     FROM batch_teachers bt
     JOIN batches b ON b.id = bt.batch_id
     LEFT JOIN batch_students bs ON bs.batch_id = b.id
     LEFT JOIN batch_teachers bt2 ON bt2.batch_id = b.id
     LEFT JOIN student_question_progress sqp ON sqp.student_id = bs.student_id
     WHERE bt.teacher_id = $1 AND b.is_active = TRUE
     GROUP BY b.id, b.name, b.code, b.description, b.is_active, b.created_at
     ORDER BY b.created_at DESC`,
    [teacherId]
  );

  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    code: r.code as string,
    description: r.description as string | null,
    is_active: r.is_active as boolean,
    created_at: String(r.created_at),
    student_count: r.student_count as number,
    teacher_count: r.teacher_count as number,
    avg_accuracy: r.avg_accuracy as number | null,
    doubts_pending: r.doubts_pending as number,
  }));
}

/**
 * Returns student IDs in the batches assigned to a teacher.
 * Used for scoping teacher analytics to only relevant students.
 */
export async function getStudentIdsInTeacherBatches(
  teacherId: string
): Promise<string[]> {
  const pool = getPool();
  const { rows } = await pool.query<{ student_id: string }>(
    `SELECT DISTINCT bs.student_id
     FROM batch_teachers bt
     JOIN batch_students bs ON bs.batch_id = bt.batch_id
     WHERE bt.teacher_id = $1`,
    [teacherId]
  );
  return rows.map((r) => r.student_id);
}

// ============================================================
// BATCH CRUD (admin)
// ============================================================

export async function createBatch(input: {
  name: string;
  code: string;
  description?: string;
}): Promise<BatchRow> {
  const pool = getPool();
  const normalizedCode = input.code.trim().toUpperCase();
  const { rows } = await pool.query<{
    id: string; name: string; code: string; description: string | null;
    is_active: boolean; created_at: string;
  }>(
    `INSERT INTO batches (name, code, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.name.trim(), normalizedCode, input.description ?? null]
  );
  const r = rows[0];
  return {
    id: r.id, name: r.name, code: r.code,
    description: r.description, is_active: r.is_active,
    created_at: String(r.created_at),
  };
}

export async function updateBatch(
  batchId: string,
  input: { name?: string; description?: string; is_active?: boolean }
): Promise<BatchRow | null> {
  const pool = getPool();
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) { setClauses.push(`name = $${idx++}`); params.push(input.name.trim()); }
  if (input.description !== undefined) { setClauses.push(`description = $${idx++}`); params.push(input.description); }
  if (input.is_active !== undefined) { setClauses.push(`is_active = $${idx++}`); params.push(input.is_active); }

  if (setClauses.length === 0) return getBatchById(batchId);

  params.push(batchId);
  const { rows } = await pool.query(
    `UPDATE batches SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id as string, name: r.name as string, code: r.code as string,
    description: r.description as string | null, is_active: r.is_active as boolean,
    created_at: String(r.created_at),
  };
}

export async function softDeleteBatch(batchId: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE batches SET is_active = FALSE WHERE id = $1`,
    [batchId]
  );
  return (rowCount ?? 0) > 0;
}

// ============================================================
// DOUBT ROUTING
// ============================================================

/**
 * Routes a doubt notification to the correct teacher based on:
 *   student → batch → subject → assigned teacher
 *
 * Falls back to the question's author (teacher_id) if no batch-teacher
 * mapping exists. This ensures backward compatibility during migration.
 *
 * Returns batchId for notification enrichment (Phase D).
 */
export async function routeDoubtToTeacher(
  studentId: string,
  questionId: string
): Promise<DoubtRouteResult> {
  const pool = getPool();

  // 1. Get the question's author, chapter name, and subject_id
  const questionRes = await pool.query<{
    teacher_id: string;
    chapter_name: string;
    subject_id: string;
  }>(
    `SELECT q.teacher_id, c.name AS chapter_name, q.subject_id
     FROM questions q
     JOIN chapters c ON c.id = q.chapter_id
     WHERE q.id = $1`,
    [questionId]
  );

  if (questionRes.rows.length === 0) {
    throw new Error(`Question with ID ${questionId} not found`);
  }

  const { teacher_id: authorId, chapter_name: chapterName, subject_id: subjectId } =
    questionRes.rows[0];

  // 2. Try to find mapped teacher via batch_students → batch_teachers
  const mappedTeacherRes = await pool.query<{ teacher_id: string; batch_id: string }>(
    `SELECT bt.teacher_id, bs.batch_id
     FROM batch_students bs
     JOIN batch_teachers bt ON bt.batch_id = bs.batch_id AND bt.subject_id = $2
     WHERE bs.student_id = $1
     LIMIT 1`,
    [studentId, subjectId]
  );

  if (mappedTeacherRes.rows.length > 0) {
    const { teacher_id: teacherId, batch_id: batchId } = mappedTeacherRes.rows[0];
    return { teacherId, chapterName, batchId, usedBatchRoute: true };
  }

  // 3. Fallback: route to question author
  return { teacherId: authorId, chapterName, batchId: null, usedBatchRoute: false };
}
