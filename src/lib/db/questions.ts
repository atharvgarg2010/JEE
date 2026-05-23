import { getPool } from "@/lib/db/postgres";
import type {
  DifficultyLevel,
  McqOption,
  Question,
  QuestionType,
  QuestionWithRelations,
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
  correct_answer: string;
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

function parseOptions(raw: unknown): McqOption[] | null {
  if (!raw) return null;
  if (typeof raw === "string") return JSON.parse(raw) as McqOption[];
  return raw as McqOption[];
}

function mapQuestion(row: Record<string, unknown>): Question {
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
    correct_answer: row.correct_answer as string,
    solution: row.solution as string,
    tags: (row.tags as string[]) ?? [],
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
     WHERE q.id = $1 AND q.teacher_id = $2`,
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
