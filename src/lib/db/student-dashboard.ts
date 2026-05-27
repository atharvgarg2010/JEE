import { getPool } from "@/lib/db/postgres";
import {
  CREATED_BY_TEACHER_SLUG,
  DIFFICULTY_LEVELS,
  MODULE_CATEGORY_SLUGS,
} from "@/lib/constants/questions";
import type {
  CategoryBucketStats,
  ChapterAnalytics,
  ChapterSummary,
  DailyActivity,
  DashboardOverview,
  MistakeFilter,
  PendingActions,
  QuestionListItem,
  SubjectSummary,
  WeakChapter,
} from "@/types/dashboard";

function pct(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

export async function getPendingActions(studentId: string): Promise<PendingActions> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE p.doubt_marked AND NOT p.doubt_resolved)::int AS doubts_pending,
      COUNT(*) FILTER (WHERE p.status = 'WRONG')::int AS mistakes_pending,
      COUNT(*) FILTER (WHERE p.saved_for_revision)::int AS revision_pending
     FROM student_question_progress p
     WHERE p.student_id = $1`,
    [studentId],
  );

  const today = await pool.query(
    `SELECT COUNT(*)::int AS c FROM question_attempts
     WHERE student_id = $1 AND attempted_at >= CURRENT_DATE`,
    [studentId],
  );

  const streak = await computeStreak(studentId);

  return {
    doubts_pending: rows[0]?.doubts_pending ?? 0,
    mistakes_pending: rows[0]?.mistakes_pending ?? 0,
    revision_pending: rows[0]?.revision_pending ?? 0,
    today_solved: today.rows[0]?.c ?? 0,
    streak,
  };
}

export async function computeStreak(studentId: string): Promise<number> {
  const { rows } = await getPool().query(
    `SELECT DISTINCT (attempted_at AT TIME ZONE 'UTC')::date AS day
     FROM question_attempts
     WHERE student_id = $1
     ORDER BY day DESC`,
    [studentId],
  );

  if (rows.length === 0) return 0;

  const days = rows.map((r) => {
    const d = r.day as Date;
    return d.toISOString().slice(0, 10);
  });

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export async function getDailyActivity(
  studentId: string,
  monthsBack = 12,
): Promise<DailyActivity[]> {
  const { rows } = await getPool().query(
    `SELECT
      (attempted_at AT TIME ZONE 'UTC')::date AS day,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE is_correct)::int AS correct,
      COUNT(*) FILTER (WHERE NOT is_correct)::int AS wrong
     FROM question_attempts
     WHERE student_id = $1
       AND attempted_at >= NOW() - ($2::int || ' months')::interval
     GROUP BY day
     ORDER BY day`,
    [studentId, monthsBack],
  );

  return rows.map((r) => ({
    date: String(r.day).slice(0, 10),
    total: r.total as number,
    correct: r.correct as number,
    wrong: r.wrong as number,
  }));
}

export async function getSubjectSummaries(
  studentId: string,
): Promise<SubjectSummary[]> {
  const { rows } = await getPool().query(
    `SELECT
      s.id, s.name, s.slug,
      COUNT(DISTINCT q.id)::int AS total_questions,
      COUNT(DISTINCT q.id) FILTER (WHERE p.total_attempts > 0)::int AS attempted,
      COUNT(DISTINCT q.id) FILTER (WHERE p.status = 'MASTERED')::int AS mastered,
      COUNT(DISTINCT c.id)::int AS chapters_count
     FROM subjects s
     LEFT JOIN chapters c ON c.subject_id = s.id
     LEFT JOIN questions q ON q.subject_id = s.id
     LEFT JOIN student_question_progress p
       ON p.question_id = q.id AND p.student_id = $1
     GROUP BY s.id, s.name, s.slug
     ORDER BY s.name`,
    [studentId],
  );

  return rows.map((r) => {
    const total = r.total_questions as number;
    const mastered = r.mastered as number;
    return {
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
      total_questions: total,
      attempted: r.attempted as number,
      mastered,
      mastery_percent: pct(mastered, total),
      chapters_count: r.chapters_count as number,
    };
  });
}

export async function getChaptersForSubject(
  studentId: string,
  subjectSlug: string,
): Promise<{ subject: SubjectSummary; chapters: ChapterSummary[] } | null> {
  const { rows: subRows } = await getPool().query(
    `SELECT id, name, slug FROM subjects WHERE slug = $1`,
    [subjectSlug],
  );
  if (!subRows[0]) return null;
  const subjectId = subRows[0].id as string;

  const summaries = await getSubjectSummaries(studentId);
  const subject =
    summaries.find((s) => s.id === subjectId) ?? {
      id: subjectId,
      name: subRows[0].name as string,
      slug: subjectSlug,
      total_questions: 0,
      attempted: 0,
      mastered: 0,
      mastery_percent: 0,
      chapters_count: 0,
    };

  const { rows } = await getPool().query(
    `SELECT
      c.id, c.name, c.slug,
      COUNT(DISTINCT q.id)::int AS total,
      COUNT(DISTINCT q.id) FILTER (WHERE p.total_attempts > 0)::int AS attempted,
      COUNT(DISTINCT q.id) FILTER (WHERE p.status = 'MASTERED')::int AS mastered,
      COUNT(DISTINCT q.id) FILTER (
        WHERE la.is_correct = TRUE
      )::int AS correct_latest
     FROM chapters c
     LEFT JOIN questions q ON q.chapter_id = c.id AND q.subject_id = $2
     LEFT JOIN student_question_progress p
       ON p.question_id = q.id AND p.student_id = $1
     LEFT JOIN LATERAL (
       SELECT is_correct FROM question_attempts
       WHERE student_id = $1 AND question_id = q.id
       ORDER BY attempt_number DESC LIMIT 1
     ) la ON TRUE
     WHERE c.subject_id = $2
     GROUP BY c.id, c.name, c.slug, c.sort_order
     ORDER BY c.sort_order`,
    [studentId, subjectId],
  );

  const chapters: ChapterSummary[] = rows.map((r) => {
    const total = r.total as number;
    const attempted = r.attempted as number;
    const mastered = r.mastered as number;
    return {
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
      total_questions: total,
      attempted,
      remaining: Math.max(0, total - attempted),
      mastered,
      mastery_percent: pct(mastered, total),
      accuracy_percent: pct(r.correct_latest as number, attempted),
    };
  });

  return { subject, chapters };
}

async function bucketStats(
  studentId: string,
  subjectId: string,
  chapterId: string,
  categoryId: string,
  difficulty: string | null,
  label: string,
  key: string,
  group: "module" | "created_by_teacher",
  categorySlug: string,
): Promise<CategoryBucketStats> {
  const params: unknown[] = [studentId, subjectId, chapterId, categoryId];
  let diffSql = "";
  if (difficulty) {
    diffSql = ` AND q.difficulty = $5`;
    params.push(difficulty);
  }

  const { rows } = await getPool().query(
    `SELECT
      COUNT(q.id)::int AS total,
      COUNT(q.id) FILTER (WHERE p.total_attempts > 0)::int AS attempted,
      COUNT(q.id) FILTER (WHERE la.is_correct = TRUE)::int AS correct_count
     FROM questions q
     LEFT JOIN student_question_progress p
       ON p.question_id = q.id AND p.student_id = $1
     LEFT JOIN LATERAL (
       SELECT is_correct FROM question_attempts
       WHERE student_id = $1 AND question_id = q.id
       ORDER BY attempt_number DESC LIMIT 1
     ) la ON TRUE
     WHERE q.subject_id = $2 AND q.chapter_id = $3 AND q.category_id = $4${diffSql}`,
    params,
  );

  const total = rows[0]?.total ?? 0;
  const attempted = rows[0]?.attempted ?? 0;
  const correct = rows[0]?.correct_count ?? 0;

  return {
    key,
    label,
    category_id: categoryId,
    category_slug: categorySlug,
    difficulty: difficulty as CategoryBucketStats["difficulty"],
    group,
    total,
    attempted,
    remaining: Math.max(0, total - attempted),
    correct_count: correct,
    accuracy_percent: pct(correct, attempted),
    progress_percent: pct(attempted, total),
  };
}

export async function getChapterAnalytics(
  studentId: string,
  subjectSlug: string,
  chapterId: string,
): Promise<ChapterAnalytics | null> {
  const pool = getPool();
  const { rows: chRows } = await pool.query(
    `SELECT c.id, c.name, c.subject_id, s.name AS subject_name, s.slug AS subject_slug
     FROM chapters c
     JOIN subjects s ON s.id = c.subject_id
     WHERE c.id = $1 AND s.slug = $2`,
    [chapterId, subjectSlug],
  );
  if (!chRows[0]) return null;

  const subjectId = chRows[0].subject_id as string;
  const { rows: categories } = await pool.query(
    `SELECT id, name, slug FROM question_categories ORDER BY sort_order`,
  );
  const catBySlug = Object.fromEntries(
    categories.map((c) => [c.slug as string, c]),
  );

  const moduleStats: CategoryBucketStats[] = [];
  for (const slug of MODULE_CATEGORY_SLUGS) {
    const cat = catBySlug[slug];
    if (!cat) continue;
    moduleStats.push(
      await bucketStats(
        studentId,
        subjectId,
        chapterId,
        cat.id as string,
        null,
        cat.name as string,
        `mod-${slug}`,
        "module",
        slug,
      ),
    );
  }

  const cbt = catBySlug[CREATED_BY_TEACHER_SLUG];
  const created_by_teacher: CategoryBucketStats[] = [];
  if (cbt) {
    for (const diff of DIFFICULTY_LEVELS) {
      const label = diff.charAt(0).toUpperCase() + diff.slice(1);
      created_by_teacher.push(
        await bucketStats(
          studentId,
          subjectId,
          chapterId,
          cbt.id as string,
          diff,
          label,
          `cbt-${diff}`,
          "created_by_teacher",
          CREATED_BY_TEACHER_SLUG,
        ),
      );
    }
  }

  return {
    chapter_id: chapterId,
    chapter_name: chRows[0].name as string,
    subject_id: subjectId,
    subject_name: chRows[0].subject_name as string,
    module: moduleStats,
    created_by_teacher,
  };
}

export async function getWeakChapters(
  studentId: string,
  limit = 5,
): Promise<WeakChapter[]> {
  const { rows } = await getPool().query(
    `SELECT
      c.id AS chapter_id,
      c.name AS chapter_name,
      s.name AS subject_name,
      s.slug AS subject_slug,
      COUNT(DISTINCT q.id) FILTER (WHERE p.total_attempts > 0)::int AS attempted,
      COUNT(DISTINCT q.id) FILTER (WHERE la.is_correct = TRUE)::int AS correct_latest,
      COUNT(DISTINCT q.id) FILTER (WHERE p.doubt_marked AND NOT p.doubt_resolved)::int AS doubt_count,
      COUNT(DISTINCT q.id) FILTER (WHERE p.status = 'WRONG')::int AS mistake_count,
      COALESCE(AVG(la.time_taken_seconds) FILTER (WHERE p.total_attempts > 0), 0)::int AS avg_time
     FROM chapters c
     JOIN subjects s ON s.id = c.subject_id
     LEFT JOIN questions q ON q.chapter_id = c.id
     LEFT JOIN student_question_progress p
       ON p.question_id = q.id AND p.student_id = $1
     LEFT JOIN LATERAL (
       SELECT is_correct, time_taken_seconds FROM question_attempts
       WHERE student_id = $1 AND question_id = q.id
       ORDER BY attempt_number DESC LIMIT 1
     ) la ON TRUE
     GROUP BY c.id, c.name, s.name, s.slug
     HAVING COUNT(DISTINCT q.id) FILTER (WHERE p.total_attempts > 0) > 0
     ORDER BY
       (COUNT(DISTINCT q.id) FILTER (WHERE la.is_correct = TRUE)::float
         / NULLIF(COUNT(DISTINCT q.id) FILTER (WHERE p.total_attempts > 0), 0)) ASC NULLS FIRST,
       COUNT(DISTINCT q.id) FILTER (WHERE p.status = 'WRONG') DESC
     LIMIT $2`,
    [studentId, limit],
  );

  return rows.map((r) => {
    const attempted = r.attempted as number;
    const accuracy = pct(r.correct_latest as number, attempted);
    const doubt = r.doubt_count as number;
    const mistakes = r.mistake_count as number;
    const avgTime = r.avg_time as number;
    const weakness_score = Math.round(
      (100 - accuracy) * 0.4 + mistakes * 8 + doubt * 5 + Math.min(avgTime / 30, 40),
    );
    return {
      chapter_id: r.chapter_id as string,
      chapter_name: r.chapter_name as string,
      subject_name: r.subject_name as string,
      subject_slug: r.subject_slug as string,
      accuracy_percent: accuracy,
      doubt_count: doubt,
      mistake_count: mistakes,
      avg_time_seconds: avgTime,
      weakness_score,
    };
  });
}

export async function getDashboardOverview(
  studentId: string,
): Promise<DashboardOverview> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
      COUNT(DISTINCT q.id)::int AS total,
      COUNT(DISTINCT q.id) FILTER (WHERE p.total_attempts > 0)::int AS attempted,
      COUNT(DISTINCT q.id) FILTER (WHERE p.status = 'MASTERED')::int AS mastered
     FROM questions q
     LEFT JOIN student_question_progress p
       ON p.question_id = q.id AND p.student_id = $1`,
    [studentId],
  );

  const total = rows[0]?.total ?? 0;
  const mastered = rows[0]?.mastered ?? 0;
  const pending = await getPendingActions(studentId);

  const [subjects, weak_chapters, calendar] = await Promise.all([
    getSubjectSummaries(studentId),
    getWeakChapters(studentId),
    getDailyActivity(studentId),
  ]);

  return {
    total_questions: total,
    attempted: rows[0]?.attempted ?? 0,
    mastered,
    mastery_percent: pct(mastered, total),
    pending,
    streak: pending.streak,
    today_solved: pending.today_solved,
    subjects,
    weak_chapters,
    calendar,
  };
}

function mapQuestionRow(r: Record<string, unknown>): QuestionListItem {
  return {
    id: r.id as string,
    question_text: r.question_text as string,
    question_type: r.question_type as QuestionListItem["question_type"],
    subject_id: r.subject_id as string,
    subject_name: r.subject_name as string,
    chapter_id: r.chapter_id as string,
    chapter_name: r.chapter_name as string,
    category_id: r.category_id as string,
    category_name: r.category_name as string,
    category_slug: r.category_slug as string,
    difficulty: r.difficulty as QuestionListItem["difficulty"],
    status: r.status as QuestionListItem["status"],
    total_attempts: r.total_attempts as number,
    last_attempted_at: r.last_attempted_at
      ? String(r.last_attempted_at)
      : null,
    doubt_marked_at: r.doubt_marked_at ? String(r.doubt_marked_at) : null,
    doubt_resolved: (r.doubt_resolved as boolean) ?? false,
    revision_saved_at: r.revision_saved_at
      ? String(r.revision_saved_at)
      : null,
    latest_correct: r.latest_correct as boolean | null,
  };
}

const QUESTION_LIST_SQL = `
  SELECT
    q.id, q.question_text, q.question_type::text AS question_type,
    q.subject_id, s.name AS subject_name,
    q.chapter_id, c.name AS chapter_name,
    q.category_id, cat.name AS category_name, cat.slug AS category_slug,
    q.difficulty::text AS difficulty,
    p.status, p.total_attempts, p.last_attempted_at,
    p.doubt_marked_at, COALESCE(p.doubt_resolved, FALSE) AS doubt_resolved,
    p.revision_saved_at,
    la.is_correct AS latest_correct
  FROM questions q
  JOIN subjects s ON s.id = q.subject_id
  JOIN chapters c ON c.id = q.chapter_id
  JOIN question_categories cat ON cat.id = q.category_id
  JOIN student_question_progress p ON p.question_id = q.id AND p.student_id = $1
  LEFT JOIN LATERAL (
    SELECT is_correct FROM question_attempts
    WHERE student_id = $1 AND question_id = q.id
    ORDER BY attempt_number DESC LIMIT 1
  ) la ON TRUE
`;

export async function getMistakeQuestions(
  studentId: string,
  filter: MistakeFilter = "recent",
  chapterId?: string,
): Promise<QuestionListItem[]> {
  let orderBy = `p.last_attempted_at DESC NULLS LAST`;
  if (filter === "repeated") orderBy = `p.total_attempts DESC, p.last_attempted_at DESC`;
  if (filter === "chapter") orderBy = `c.name ASC, p.last_attempted_at DESC`;

  let chapterSql = "";
  const params: unknown[] = [studentId];
  if (chapterId) {
    chapterSql = ` AND q.chapter_id = $2`;
    params.push(chapterId);
  }

  const { rows } = await getPool().query(
    `${QUESTION_LIST_SQL}
     WHERE p.status = 'WRONG'${chapterSql}
     ORDER BY ${orderBy}`,
    params,
  );

  return rows.map(mapQuestionRow);
}

export async function getDoubtQuestions(
  studentId: string,
  resolved?: boolean,
): Promise<QuestionListItem[]> {
  let statusSql = `p.doubt_marked = TRUE`;
  if (resolved === true) statusSql += ` AND p.doubt_resolved = TRUE`;
  else if (resolved === false) statusSql += ` AND NOT p.doubt_resolved`;

  const { rows } = await getPool().query(
    `${QUESTION_LIST_SQL}
     WHERE ${statusSql}
     ORDER BY p.doubt_marked_at DESC NULLS LAST, p.last_attempted_at DESC`,
    [studentId],
  );

  return rows.map(mapQuestionRow);
}

export async function getRevisionQuestions(
  studentId: string,
): Promise<QuestionListItem[]> {
  const { rows } = await getPool().query(
    `${QUESTION_LIST_SQL}
     WHERE p.saved_for_revision = TRUE
     ORDER BY p.revision_saved_at DESC NULLS LAST`,
    [studentId],
  );

  return rows.map(mapQuestionRow);
}
