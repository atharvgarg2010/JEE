import { getPool } from "@/lib/db/postgres";
import type {
  TeacherStudentAnalyticsBuckets,
  TeacherStudentProfile,
} from "@/types/teacher-analytics";

const LIST_LIMIT = 9;
const INACTIVE_DAYS = 7;
const MIN_ATTEMPTS_FOR_RANKING = 3;

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / 86400000);
}

function computeStreakFromDays(sortedDaysDesc: string[]): number {
  if (sortedDaysDesc.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (sortedDaysDesc[0] !== today && sortedDaysDesc[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDaysDesc.length; i++) {
    const prev = new Date(sortedDaysDesc[i - 1]);
    const curr = new Date(sortedDaysDesc[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

async function fetchStreaksByStudent(
  teacherId: string,
  studentIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (studentIds.length === 0) return map;

  const { rows } = await getPool().query(
    `SELECT
      a.student_id,
      (a.attempted_at AT TIME ZONE 'UTC')::date AS day
     FROM question_attempts a
     INNER JOIN questions q ON q.id = a.question_id AND q.teacher_id = $1
     WHERE a.student_id = ANY($2::uuid[])
     GROUP BY a.student_id, day
     ORDER BY a.student_id, day DESC`,
    [teacherId, studentIds],
  );

  const byStudent = new Map<string, string[]>();
  for (const r of rows) {
    const sid = r.student_id as string;
    const day = String(r.day).slice(0, 10);
    const list = byStudent.get(sid) ?? [];
    list.push(day);
    byStudent.set(sid, list);
  }

  for (const [sid, days] of byStudent) {
    map.set(sid, computeStreakFromDays(days));
  }

  return map;
}

interface RawStudentRow {
  id: string;
  name: string;
  total_attempts: number;
  correct_attempts: number;
  questions_attempted: number;
  last_attempted_at: string | null;
  recent_correct: number;
  recent_total: number;
  prior_correct: number;
  prior_total: number;
  mastered: number;
  progress_attempted: number;
  doubts: number;
  mistakes: number;
}

async function fetchStudentMetrics(
  teacherId: string,
): Promise<RawStudentRow[]> {
  const { rows } = await getPool().query(
    `WITH tq AS (
      SELECT id FROM questions WHERE teacher_id = $1
    ),
    attempt_stats AS (
      SELECT
        u.id,
        COALESCE(u.full_name, u.username) AS name,
        COUNT(a.id)::int AS total_attempts,
        COUNT(a.id) FILTER (WHERE a.is_correct)::int AS correct_attempts,
        COUNT(DISTINCT a.question_id)::int AS questions_attempted,
        MAX(a.attempted_at) AS last_attempted_at,
        COUNT(a.id) FILTER (
          WHERE a.attempted_at >= NOW() - INTERVAL '7 days' AND a.is_correct
        )::int AS recent_correct,
        COUNT(a.id) FILTER (
          WHERE a.attempted_at >= NOW() - INTERVAL '7 days'
        )::int AS recent_total,
        COUNT(a.id) FILTER (
          WHERE a.attempted_at >= NOW() - INTERVAL '14 days'
            AND a.attempted_at < NOW() - INTERVAL '7 days'
            AND a.is_correct
        )::int AS prior_correct,
        COUNT(a.id) FILTER (
          WHERE a.attempted_at >= NOW() - INTERVAL '14 days'
            AND a.attempted_at < NOW() - INTERVAL '7 days'
        )::int AS prior_total
      FROM users u
      INNER JOIN question_attempts a ON a.student_id = u.id
      INNER JOIN tq ON tq.id = a.question_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.full_name, u.username
    ),
    progress_stats AS (
      SELECT
        p.student_id,
        COUNT(*) FILTER (WHERE p.status = 'MASTERED')::int AS mastered,
        COUNT(DISTINCT p.question_id) FILTER (WHERE p.total_attempts > 0)::int AS progress_attempted,
        COUNT(*) FILTER (
          WHERE p.doubt_marked AND NOT COALESCE(p.doubt_resolved, FALSE)
        )::int AS doubts,
        COUNT(*) FILTER (WHERE p.status = 'WRONG')::int AS mistakes
      FROM student_question_progress p
      INNER JOIN tq ON tq.id = p.question_id
      GROUP BY p.student_id
    )
    SELECT
      a.id,
      a.name,
      a.total_attempts,
      a.correct_attempts,
      a.questions_attempted,
      a.last_attempted_at,
      a.recent_correct,
      a.recent_total,
      a.prior_correct,
      a.prior_total,
      COALESCE(p.mastered, 0)::int AS mastered,
      COALESCE(p.progress_attempted, 0)::int AS progress_attempted,
      COALESCE(p.doubts, 0)::int AS doubts,
      COALESCE(p.mistakes, 0)::int AS mistakes
    FROM attempt_stats a
    LEFT JOIN progress_stats p ON p.student_id = a.id`,
    [teacherId],
  );

  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    total_attempts: r.total_attempts as number,
    correct_attempts: r.correct_attempts as number,
    questions_attempted: r.questions_attempted as number,
    last_attempted_at: r.last_attempted_at
      ? String(r.last_attempted_at)
      : null,
    recent_correct: r.recent_correct as number,
    recent_total: r.recent_total as number,
    prior_correct: r.prior_correct as number,
    prior_total: r.prior_total as number,
    mastered: r.mastered as number,
    progress_attempted: r.progress_attempted as number,
    doubts: r.doubts as number,
    mistakes: r.mistakes as number,
  }));
}

function mapToProfiles(
  rows: RawStudentRow[],
  streaks: Map<string, number>,
): TeacherStudentProfile[] {
  return rows.map((r) => {
    const accuracy = pct(r.correct_attempts, r.total_attempts);
    const recentAcc = pct(r.recent_correct, r.recent_total);
    const priorAcc = pct(r.prior_correct, r.prior_total);
    const masteryPercent = pct(r.mastered, r.progress_attempted);
    const inactive = daysSince(r.last_attempted_at);

    let improvement: number | null = null;
    if (r.prior_total >= MIN_ATTEMPTS_FOR_RANKING && r.recent_total >= 1) {
      improvement = recentAcc - priorAcc;
    }

    return {
      id: r.id,
      name: r.name,
      accuracy,
      questionsAttempted: r.questions_attempted,
      masteryPercent,
      currentStreak: streaks.get(r.id) ?? 0,
      doubtsCount: r.doubts,
      mistakesPending: r.mistakes,
      daysInactive: inactive,
      improvement,
      previousAccuracy: r.prior_total > 0 ? priorAcc : null,
      lastAttemptedAt: r.last_attempted_at,
    };
  });
}

function bucketStudents(
  profiles: TeacherStudentProfile[],
): TeacherStudentAnalyticsBuckets {
  const ranked = profiles.filter(
    (p) => p.questionsAttempted >= MIN_ATTEMPTS_FOR_RANKING,
  );

  const top = [...ranked]
    .filter(
      (p) =>
        p.accuracy >= 65 &&
        (p.masteryPercent >= 20 || p.currentStreak >= 3),
    )
    .sort(
      (a, b) =>
        b.accuracy - a.accuracy ||
        b.masteryPercent - a.masteryPercent ||
        b.currentStreak - a.currentStreak,
    )
    .slice(0, LIST_LIMIT);

  const weak = [...ranked]
    .filter(
      (p) =>
        p.accuracy < 55 ||
        p.mistakesPending >= 2 ||
        (p.doubtsCount >= 2 && p.accuracy < 70),
    )
    .sort(
      (a, b) =>
        a.accuracy - b.accuracy ||
        b.mistakesPending - a.mistakesPending ||
        b.doubtsCount - a.doubtsCount,
    )
    .slice(0, LIST_LIMIT);

  const improving = [...ranked]
    .filter((p) => p.improvement !== null && p.improvement >= 5)
    .sort((a, b) => (b.improvement ?? 0) - (a.improvement ?? 0))
    .slice(0, LIST_LIMIT);

  const inactive = [...profiles]
    .filter(
      (p) =>
        p.daysInactive !== null && p.daysInactive >= INACTIVE_DAYS,
    )
    .sort((a, b) => (b.daysInactive ?? 0) - (a.daysInactive ?? 0))
    .slice(0, LIST_LIMIT);

  return { top, weak, improving, inactive };
}

export async function getTeacherStudentAnalytics(
  teacherId: string,
): Promise<TeacherStudentAnalyticsBuckets> {
  const rows = await fetchStudentMetrics(teacherId);
  const studentIds = rows.map((r) => r.id);
  const streaks = await fetchStreaksByStudent(teacherId, studentIds);
  const profiles = mapToProfiles(rows, streaks);
  return bucketStudents(profiles);
}
