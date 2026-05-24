import { getPool } from "@/lib/db/postgres";
import type { McqOption, QuestionType } from "@/types/questions";

export interface StudentQuestionRow {
  id: string;
  subject_id: string;
  chapter_id: string;
  category_id: string;
  difficulty: string | null;
  question_type: QuestionType;
  question_text: string;
  options: McqOption[] | null;
  tags: string[];
  subject_name: string;
  chapter_name: string;
  category_name: string;
  created_at: string;
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

/**
 * Fetch all published questions for students (no teacher_id filter).
 */
export async function listStudentQuestions(filters: {
  subjectId?: string;
  chapterId?: string;
  categoryId?: string;
  difficulty?: string;
}): Promise<StudentQuestionRow[]> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];
  let i = 1;

  if (filters.subjectId) {
    conditions.push(`q.subject_id = $${i++}`);
    params.push(filters.subjectId);
  }
  if (filters.chapterId) {
    conditions.push(`q.chapter_id = $${i++}`);
    params.push(filters.chapterId);
  }
  if (filters.categoryId) {
    conditions.push(`q.category_id = $${i++}`);
    params.push(filters.categoryId);
  }
  if (filters.difficulty) {
    conditions.push(`q.difficulty = $${i++}`);
    params.push(filters.difficulty);
  }

  const { rows } = await getPool().query(
    `SELECT
      q.id,
      q.subject_id,
      q.chapter_id,
      q.category_id,
      q.difficulty::text AS difficulty,
      q.question_type::text AS question_type,
      q.question_text,
      q.options,
      COALESCE(q.tags, ARRAY[]::text[]) AS tags,
      q.created_at,
      s.name AS subject_name,
      c.name AS chapter_name,
      cat.name AS category_name
     FROM questions q
     INNER JOIN subjects s ON s.id = q.subject_id
     INNER JOIN chapters c ON c.id = q.chapter_id
     INNER JOIN question_categories cat ON cat.id = q.category_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY q.created_at DESC`,
    params,
  );

  return rows.map((row) => ({
    id: row.id as string,
    subject_id: row.subject_id as string,
    chapter_id: row.chapter_id as string,
    category_id: row.category_id as string,
    difficulty: row.difficulty as string | null,
    question_type: row.question_type as QuestionType,
    question_text: row.question_text as string,
    options: parseOptions(row.options),
    tags: row.tags as string[],
    subject_name: row.subject_name as string,
    chapter_name: row.chapter_name as string,
    category_name: row.category_name as string,
    created_at: String(row.created_at),
  }));
}

/** Chapters that have at least one question for a subject. */
export async function getChaptersWithQuestions(subjectId: string) {
  const { rows } = await getPool().query(
    `SELECT c.id, c.name, c.slug, COUNT(q.id)::int AS question_count
     FROM chapters c
     INNER JOIN questions q ON q.chapter_id = c.id AND q.subject_id = c.subject_id
     WHERE c.subject_id = $1
     GROUP BY c.id, c.name, c.slug, c.sort_order
     HAVING COUNT(q.id) > 0
     ORDER BY c.sort_order`,
    [subjectId],
  );
  return rows;
}
