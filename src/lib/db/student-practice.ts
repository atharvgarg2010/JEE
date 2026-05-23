import { getPool } from "@/lib/db/postgres";
import {
  computeStatusFromProgress,
  getLatestAttempt,
  getProgress,
} from "@/lib/db/question-attempts";
import type {
  CategoryProgress,
  ChapterProgress,
  McqOption,
  PracticeFilter,
  QuestionAttempt,
  QuestionStatus,
  QuestionType,
  StudentQuestionProgress,
  StudentQuestionPublic,
  StudentQuestionWithAttempt,
} from "@/types/questions";

export function deriveAttemptStatus(
  progress: StudentQuestionProgress | null,
  latest: QuestionAttempt | null,
): QuestionStatus {
  return computeStatusFromProgress(progress, latest);
}

export async function enrichStudentQuestion(
  studentId: string,
  q: Omit<StudentQuestionPublic, "difficulty"> & { difficulty?: string | null },
): Promise<StudentQuestionWithAttempt> {
  const base: StudentQuestionPublic = {
    ...q,
    difficulty: (q.difficulty ?? null) as StudentQuestionPublic["difficulty"],
  };
  const [progress, latest] = await Promise.all([
    getProgress(studentId, base.id),
    getLatestAttempt(studentId, base.id),
  ]);
  return {
    ...base,
    progress,
    latest_attempt: latest,
    status: computeStatusFromProgress(progress, latest),
  };
}

function parseOptions(raw: unknown): McqOption[] | null {
  if (!raw) return null;
  if (typeof raw === "string") return JSON.parse(raw) as McqOption[];
  return raw as McqOption[];
}

function filterClause(filter: PracticeFilter): string {
  switch (filter) {
    case "attempted":
      return `AND p.total_attempts > 0`;
    case "not_attempted":
      return `AND (p.student_id IS NULL OR p.total_attempts = 0)`;
    case "doubts":
      return `AND p.doubt_marked AND NOT COALESCE(p.doubt_resolved, FALSE)`;
    case "revision":
      return `AND (p.saved_for_revision = TRUE OR p.status = 'REVISION')`;
    case "mastered":
      return `AND p.status = 'MASTERED'`;
    case "wrong":
      return `AND p.status = 'WRONG'`;
    default:
      return "";
  }
}

export async function getExplorerProgress(
  studentId: string,
  subjectId: string,
  chapterId: string,
): Promise<CategoryProgress[]> {
  const { rows } = await getPool().query(
    `SELECT
      cat.id AS category_id,
      cat.name AS category_name,
      cat.slug AS category_slug,
      COUNT(DISTINCT q.id)::int AS total,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.total_attempts > 0)::int AS attempted,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'MASTERED')::int AS mastered
     FROM question_categories cat
     LEFT JOIN questions q ON q.category_id = cat.id
       AND q.subject_id = $2 AND q.chapter_id = $3
     LEFT JOIN student_question_progress p ON p.question_id = q.id AND p.student_id = $1
     GROUP BY cat.id, cat.name, cat.slug, cat.sort_order
     ORDER BY cat.sort_order`,
    [studentId, subjectId, chapterId],
  );

  return rows.map((r) => {
    const total = r.total as number;
    const attempted = r.attempted as number;
    const mastered = r.mastered as number;
    return {
      category_id: r.category_id as string,
      category_name: r.category_name as string,
      category_slug: r.category_slug as string,
      total,
      attempted,
      remaining: Math.max(0, total - attempted),
      mastered,
      mastery_percent: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
  });
}

export async function getChapterProgressSummary(
  studentId: string,
  subjectId: string,
): Promise<ChapterProgress[]> {
  const { rows } = await getPool().query(
    `SELECT
      c.id AS chapter_id,
      c.name AS chapter_name,
      COUNT(DISTINCT q.id)::int AS total,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.total_attempts > 0)::int AS attempted,
      COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'MASTERED')::int AS mastered
     FROM chapters c
     LEFT JOIN questions q ON q.chapter_id = c.id AND q.subject_id = $2
     LEFT JOIN student_question_progress p ON p.question_id = q.id AND p.student_id = $1
     WHERE c.subject_id = $2
     GROUP BY c.id, c.name, c.sort_order
     ORDER BY c.sort_order`,
    [studentId, subjectId],
  );

  const chapters: ChapterProgress[] = [];
  for (const r of rows) {
    const total = r.total as number;
    const attempted = r.attempted as number;
    const mastered = r.mastered as number;
    const categories = await getExplorerProgress(
      studentId,
      subjectId,
      r.chapter_id as string,
    );
    chapters.push({
      chapter_id: r.chapter_id as string,
      chapter_name: r.chapter_name as string,
      categories,
      total,
      attempted,
      remaining: Math.max(0, total - attempted),
      mastered,
      mastery_percent: total > 0 ? Math.round((mastered / total) * 100) : 0,
    });
  }
  return chapters;
}

/** List all questions visible to students (no teacher_id filter). */
export async function listPracticeQuestions(
  studentId: string,
  params: {
    subjectId: string;
    chapterId: string;
    categoryId?: string;
    difficulty?: string;
    filter?: PracticeFilter;
  },
): Promise<StudentQuestionWithAttempt[]> {
  const filter = params.filter ?? "all";
  const extra = filterClause(filter);

  const conditions = ["q.subject_id = $2", "q.chapter_id = $3"];
  const queryParams: unknown[] = [
    studentId,
    params.subjectId,
    params.chapterId,
  ];

  if (params.categoryId) {
    conditions.push(`q.category_id = $${queryParams.length + 1}`);
    queryParams.push(params.categoryId);
  }
  if (params.difficulty) {
    conditions.push(`q.difficulty = $${queryParams.length + 1}`);
    queryParams.push(params.difficulty);
  }

  const { rows } = await getPool().query(
    `SELECT
      q.id, q.subject_id, q.chapter_id, q.category_id,
      q.difficulty::text AS difficulty,
      q.question_type::text AS question_type,
      q.question_text, q.options,
      COALESCE(q.tags, ARRAY[]::text[]) AS tags,
      s.name AS subject_name, c.name AS chapter_name,
      cat.name AS category_name, cat.slug AS category_slug,
      p.status AS prog_status, p.doubt_marked AS prog_doubt,
      COALESCE(p.doubt_resolved, FALSE) AS prog_doubt_resolved,
      p.saved_for_revision AS prog_revision, p.solution_view_count,
      p.total_attempts, p.last_attempted_at,
      p.doubt_marked_at, p.revision_saved_at
     FROM questions q
     INNER JOIN subjects s ON s.id = q.subject_id
     INNER JOIN chapters c ON c.id = q.chapter_id AND c.subject_id = q.subject_id
     INNER JOIN question_categories cat ON cat.id = q.category_id
     LEFT JOIN student_question_progress p
       ON p.question_id = q.id AND p.student_id = $1
     WHERE ${conditions.join(" AND ")}
     ${extra}
     ORDER BY q.created_at ASC`,
    queryParams,
  );

  const results: StudentQuestionWithAttempt[] = [];

  for (const row of rows) {
    const qid = row.id as string;
    const progress = row.prog_status
      ? {
          student_id: studentId,
          question_id: qid,
          status: row.prog_status as QuestionStatus,
          doubt_marked: row.prog_doubt as boolean,
          doubt_resolved: row.prog_doubt_resolved as boolean,
          saved_for_revision: row.prog_revision as boolean,
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
        }
      : null;

    const latest = await getLatestAttempt(studentId, qid);

    results.push({
      id: qid,
      subject_id: row.subject_id as string,
      chapter_id: row.chapter_id as string,
      category_id: row.category_id as string,
      difficulty: row.difficulty as StudentQuestionPublic["difficulty"],
      question_type: row.question_type as QuestionType,
      question_text: row.question_text as string,
      options: parseOptions(row.options),
      tags: (row.tags as string[]) ?? [],
      subject_name: row.subject_name as string,
      chapter_name: row.chapter_name as string,
      category_name: row.category_name as string,
      category_slug: row.category_slug as string,
      progress,
      latest_attempt: latest,
      status: computeStatusFromProgress(progress, latest),
    });
  }

  return results;
}

export async function getStudentQuestion(
  studentId: string,
  questionId: string,
  includeSolution = false,
): Promise<(StudentQuestionPublic & { solution?: string }) | null> {
  const { rows } = await getPool().query(
    `SELECT
      q.id, q.subject_id, q.chapter_id, q.category_id, q.difficulty,
      q.question_type, q.question_text, q.options, q.tags,
      ${includeSolution ? "q.solution," : ""}
      s.name AS subject_name, c.name AS chapter_name, cat.name AS category_name
     FROM questions q
     JOIN subjects s ON s.id = q.subject_id
     JOIN chapters c ON c.id = q.chapter_id
     JOIN question_categories cat ON cat.id = q.category_id
     WHERE q.id = $1`,
    [questionId],
  );

  if (!rows[0]) return null;

  const row = rows[0];
  const result: StudentQuestionPublic & { solution?: string } = {
    id: row.id as string,
    subject_id: row.subject_id as string,
    chapter_id: row.chapter_id as string,
    category_id: row.category_id as string,
    difficulty: row.difficulty as StudentQuestionPublic["difficulty"],
    question_type: row.question_type as QuestionType,
    question_text: row.question_text as string,
    options: parseOptions(row.options),
    tags: (row.tags as string[]) ?? [],
    subject_name: row.subject_name as string,
    chapter_name: row.chapter_name as string,
    category_name: row.category_name as string,
  };

  if (includeSolution) {
    const progress = await getProgress(studentId, questionId);
    const attempt = await getLatestAttempt(studentId, questionId);
    if (
      (progress?.solution_view_count ?? 0) > 0 ||
      attempt?.viewed_solution
    ) {
      result.solution = row.solution as string;
    }
  }

  return result;
}

export async function getQuestionSolution(
  studentId: string,
  questionId: string,
): Promise<string | null> {
  const progress = await getProgress(studentId, questionId);
  const attempt = await getLatestAttempt(studentId, questionId);
  if (
    (progress?.solution_view_count ?? 0) === 0 &&
    !attempt?.viewed_solution
  ) {
    return null;
  }

  const { rows } = await getPool().query(
    `SELECT solution FROM questions WHERE id = $1`,
    [questionId],
  );
  return (rows[0]?.solution as string) ?? null;
}

export async function fetchSolutionText(questionId: string): Promise<string | null> {
  const { rows } = await getPool().query(
    `SELECT solution FROM questions WHERE id = $1`,
    [questionId],
  );
  return (rows[0]?.solution as string) ?? null;
}

export async function verifyAnswer(
  questionId: string,
  selectedAnswer: string,
): Promise<boolean> {
  const { rows } = await getPool().query(
    `SELECT correct_answer, question_type FROM questions WHERE id = $1`,
    [questionId],
  );
  if (!rows[0]) return false;

  const correct = String(rows[0].correct_answer).trim();
  const selected = selectedAnswer.trim();

  if (rows[0].question_type === "integer") {
    return Number(correct) === Number(selected);
  }
  return correct === selected;
}
