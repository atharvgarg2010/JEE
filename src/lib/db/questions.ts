import { getPool } from "@/lib/db/postgres";
import type {
  DifficultyLevel,
  McqOption,
  Question,
  QuestionType,
  QuestionWithRelations,
  QuestionCorrectAnswer,
  TeacherQuestionStats,
} from "@/types/questions";

export interface CreateQuestionInput {
  teacher_id: string;
  subject_id: string;
  chapter_id: string;
  category_id: string;
  difficulty: DifficultyLevel | null;
  question_type: QuestionType;
  question_text: string;
  options: McqOption[] | null;
  correct_answer: QuestionCorrectAnswer;
  solution: string;
  tags: string[];
}

export interface QuestionFilters {
  teacher_id: string;
  search?: string;
  subject_id?: string;
  chapter_id?: string;
  category_id?: string;
  difficulty?: DifficultyLevel;
  question_type?: QuestionType;
  limit?: number;
  offset?: number;
}

function normalizeOptionItem(raw: unknown, index: number): McqOption {
  if (raw == null) {
    return { id: `opt_${index + 1}`, text: "" };
  }
  if (typeof raw === "string") {
    const text = raw.trim();
    return { id: `opt_${index + 1}`, text };
  }
  const item = raw as Record<string, unknown>;
  const text = String(item.text ?? item.id ?? "").trim();
  const id = String(item.id ?? item.text ?? `opt_${index + 1}`).trim();
  return { id, text };
}

function parseOptions(raw: unknown): McqOption[] | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const value = raw.trim();
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeOptionItem);
      }
    } catch {
      // Fallback to comma-separated list
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((text, index) => ({ id: `opt_${index + 1}`, text }));
    }
  }
  if (Array.isArray(raw)) {
    return raw.map(normalizeOptionItem);
  }
  return null;
}

function parseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((tag) => String(tag ?? "").trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function mapQuestion(row: Record<string, unknown>): Question {
  const rawCorrect = row.correct_answer;
  const correctAnswer =
    row.question_type === "integer"
      ? Number(rawCorrect)
      : String(rawCorrect ?? "");

  return {
    id: row.id as string,
    teacher_id: row.teacher_id as string,
    subject_id: row.subject_id as string,
    chapter_id: row.chapter_id as string,
    category_id: row.category_id as string,
    difficulty: (row.difficulty as DifficultyLevel | null) ?? null,
    question_type: row.question_type as QuestionType,
    question_text: row.question_text as string,
    options: parseOptions(row.options),
    correct_answer: correctAnswer,
    solution: row.solution as string,
    tags: parseTags(row.tags),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapQuestionWithRelations(
  row: Record<string, unknown>,
): QuestionWithRelations {
  return {
    ...mapQuestion(row),
    subject_name: row.subject_name as string,
    chapter_name: row.chapter_name as string,
    category_name: row.category_name as string,
    category_slug: row.category_slug as string,
  };
}

const LIST_SELECT = `
  q.*,
  s.name AS subject_name,
  c.name AS chapter_name,
  cat.name AS category_name,
  cat.slug AS category_slug
`;

const LIST_FROM = `
  FROM questions q
  JOIN subjects s ON s.id = q.subject_id
  JOIN chapters c ON c.id = q.chapter_id
  JOIN question_categories cat ON cat.id = q.category_id
`;

export async function createQuestion(
  input: CreateQuestionInput,
): Promise<QuestionWithRelations> {
  const { rows } = await getPool().query(
    `INSERT INTO questions (
      teacher_id, subject_id, chapter_id, category_id, difficulty,
      question_type, question_text, options, correct_answer, solution, tags
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id`,
    [
      input.teacher_id,
      input.subject_id,
      input.chapter_id,
      input.category_id,
      input.difficulty,
      input.question_type,
      input.question_text,
      input.options ? JSON.stringify(input.options) : null,
      input.correct_answer,
      input.solution,
      input.tags,
    ],
  );
  const created = await getQuestionById(rows[0].id as string, input.teacher_id);
  if (!created) throw new Error("Failed to fetch created question");
  return created;
}

export async function getQuestionById(
  id: string,
  teacherId: string,
): Promise<QuestionWithRelations | null> {
  const { rows } = await getPool().query(
    `SELECT ${LIST_SELECT} ${LIST_FROM}
     WHERE q.id = $1 AND (
       q.teacher_id = $2 OR
       EXISTS (
         SELECT 1 FROM batch_teachers bt
         WHERE bt.teacher_id = $2 AND bt.subject_id = q.subject_id
       ) OR
       EXISTS (
         SELECT 1 FROM teacher_notifications tn
         WHERE tn.teacher_id = $2 AND tn.question_id = q.id
       )
     )`,
    [id, teacherId],
  );
  return rows[0] ? mapQuestionWithRelations(rows[0]) : null;
}

export async function listQuestions(
  filters: QuestionFilters,
): Promise<{ questions: QuestionWithRelations[]; total: number }> {
  const conditions: string[] = ["q.teacher_id = $1"];
  const params: unknown[] = [filters.teacher_id];
  let paramIndex = 2;

  if (filters.search?.trim()) {
    conditions.push(
      `(q.question_text ILIKE $${paramIndex} OR EXISTS (
        SELECT 1 FROM unnest(q.tags) t WHERE t ILIKE $${paramIndex}
      ))`,
    );
    params.push(`%${filters.search.trim()}%`);
    paramIndex++;
  }
  if (filters.subject_id) {
    conditions.push(`q.subject_id = $${paramIndex++}`);
    params.push(filters.subject_id);
  }
  if (filters.chapter_id) {
    conditions.push(`q.chapter_id = $${paramIndex++}`);
    params.push(filters.chapter_id);
  }
  if (filters.category_id) {
    conditions.push(`q.category_id = $${paramIndex++}`);
    params.push(filters.category_id);
  }
  if (filters.difficulty) {
    conditions.push(`q.difficulty = $${paramIndex++}`);
    params.push(filters.difficulty);
  }
  if (filters.question_type) {
    conditions.push(`q.question_type = $${paramIndex++}`);
    params.push(filters.question_type);
  }

  const where = conditions.join(" AND ");
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const countResult = await getPool().query(
    `SELECT COUNT(*)::int AS total ${LIST_FROM} WHERE ${where}`,
    params,
  );

  const { rows } = await getPool().query(
    `SELECT ${LIST_SELECT} ${LIST_FROM}
     WHERE ${where}
     ORDER BY q.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    questions: rows.map(mapQuestionWithRelations),
    total: countResult.rows[0].total as number,
  };
}

export async function deleteQuestion(
  id: string,
  teacherId: string,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `DELETE FROM questions WHERE id = $1 AND teacher_id = $2`,
    [id, teacherId],
  );
  return (rowCount ?? 0) > 0;
}

export async function getTeacherQuestionStats(
  teacherId: string,
): Promise<TeacherQuestionStats> {
  const pool = getPool();

  const totals = await pool.query(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE question_type = 'mcq')::int AS mcq_count,
      COUNT(*) FILTER (WHERE question_type = 'integer')::int AS integer_count
     FROM questions WHERE teacher_id = $1`,
    [teacherId],
  );

  const byCategory = await pool.query(
    `SELECT cat.name, COUNT(q.id)::int AS count
     FROM question_categories cat
     LEFT JOIN questions q ON q.category_id = cat.id AND q.teacher_id = $1
     GROUP BY cat.id, cat.name, cat.sort_order
     ORDER BY cat.sort_order`,
    [teacherId],
  );

  const row = totals.rows[0];
  return {
    total_questions: row.total as number,
    mcq_count: row.mcq_count as number,
    integer_count: row.integer_count as number,
    by_category: byCategory.rows.map((r) => ({
      name: r.name as string,
      count: r.count as number,
    })),
  };
}

export interface TeacherQuestionInsight {
  id: string;
  title: string;
  chapter: string;
  difficulty: DifficultyLevel | null;
  type: QuestionType;
  accuracy: number;
  wrongCount: number;
  solutionViews: number;
  doubtCount: number;
  attemptCount: number;
}

export async function getTeacherQuestionInsights(
  teacherId: string,
): Promise<{
  mostWrong: TeacherQuestionInsight[];
  mostViewed: TeacherQuestionInsight[];
  highDoubt: TeacherQuestionInsight[];
  lowAccuracy: TeacherQuestionInsight[];
}> {
  const pool = getPool();

  const {
    rows,
  } = await pool.query(
    `WITH tq AS (
       SELECT q.id, q.question_text, q.question_type, q.difficulty, q.chapter_id
       FROM questions q
       WHERE q.teacher_id = $1
     ),
     question_attempts AS (
       SELECT
         a.question_id,
         COUNT(*)::int AS attempt_count,
         COUNT(*) FILTER (WHERE a.is_correct)::int AS correct_count,
         COUNT(*) FILTER (WHERE NOT a.is_correct)::int AS wrong_count
       FROM question_attempts a
       JOIN tq ON tq.id = a.question_id
       GROUP BY a.question_id
     ),
     question_views AS (
       SELECT
         question_id,
         COUNT(*)::int AS solution_views
       FROM question_solution_views
       WHERE question_id IN (SELECT id FROM tq)
       GROUP BY question_id
     ),
     question_doubts AS (
       SELECT
         question_id,
         COUNT(*)::int AS doubt_count
       FROM student_question_progress p
       WHERE question_id IN (SELECT id FROM tq)
         AND p.doubt_marked
         AND NOT COALESCE(p.doubt_resolved, FALSE)
       GROUP BY question_id
     )
     SELECT
       q.id,
       q.question_text AS title,
       c.name AS chapter,
       q.difficulty,
       q.question_type AS type,
       COALESCE(a.attempt_count, 0)::int AS attempt_count,
       COALESCE(a.correct_count, 0)::int AS correct_count,
       COALESCE(a.wrong_count, 0)::int AS wrong_count,
       COALESCE(v.solution_views, 0)::int AS solution_views,
       COALESCE(d.doubt_count, 0)::int AS doubt_count
     FROM tq q
     LEFT JOIN question_attempts a ON a.question_id = q.id
     LEFT JOIN question_views v ON v.question_id = q.id
     LEFT JOIN question_doubts d ON d.question_id = q.id
     JOIN chapters c ON c.id = q.chapter_id`,
    [teacherId],
  );

  const questions = rows.map((row) => {
    const attemptCount = Number(row.attempt_count ?? 0);
    const correctCount = Number(row.correct_count ?? 0);
    const accuracy = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0;
    return {
      id: row.id as string,
      title: (row.title as string).slice(0, 120),
      chapter: row.chapter as string,
      difficulty: (row.difficulty as DifficultyLevel | null) ?? null,
      type: row.type as QuestionType,
      accuracy,
      wrongCount: Number(row.wrong_count ?? 0),
      solutionViews: Number(row.solution_views ?? 0),
      doubtCount: Number(row.doubt_count ?? 0),
      attemptCount,
    };
  });

  return {
    mostWrong: questions
      .filter((q) => q.attemptCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount || a.accuracy - b.accuracy)
      .slice(0, 9),
    mostViewed: questions
      .sort((a, b) => b.solutionViews - a.solutionViews || b.attemptCount - a.attemptCount)
      .slice(0, 9),
    highDoubt: questions
      .filter((q) => q.doubtCount > 0)
      .sort((a, b) => b.doubtCount - a.doubtCount || a.accuracy - b.accuracy)
      .slice(0, 9),
    lowAccuracy: questions
      .filter((q) => q.attemptCount > 0)
      .sort((a, b) => a.accuracy - b.accuracy || b.attemptCount - a.attemptCount)
      .slice(0, 9),
  };
}
