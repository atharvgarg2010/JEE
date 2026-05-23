import { getPool } from "@/lib/db/postgres";
import type { Chapter, QuestionCategory, Subject } from "@/types/questions";

export async function getSubjects(): Promise<Subject[]> {
  const { rows } = await getPool().query<Subject>(
    `SELECT id, name, slug FROM subjects ORDER BY name`,
  );
  return rows;
}

export async function getChapters(subjectId?: string): Promise<Chapter[]> {
  if (subjectId) {
    const { rows } = await getPool().query<Chapter>(
      `SELECT id, subject_id, name, slug, sort_order
       FROM chapters WHERE subject_id = $1 ORDER BY sort_order, name`,
      [subjectId],
    );
    return rows;
  }
  const { rows } = await getPool().query<Chapter>(
    `SELECT id, subject_id, name, slug, sort_order FROM chapters ORDER BY sort_order, name`,
  );
  return rows;
}

export async function getCategories(): Promise<QuestionCategory[]> {
  const { rows } = await getPool().query<QuestionCategory>(
    `SELECT id, name, slug, supports_difficulty, sort_order
     FROM question_categories ORDER BY sort_order`,
  );
  return rows;
}

export async function getCategoryById(
  id: string,
): Promise<QuestionCategory | null> {
  const { rows } = await getPool().query<QuestionCategory>(
    `SELECT id, name, slug, supports_difficulty, sort_order
     FROM question_categories WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
