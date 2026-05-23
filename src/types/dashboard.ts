import type { DifficultyLevel, QuestionStatus, QuestionType } from "@/types/questions";

export interface DashboardOverview {
  total_questions: number;
  attempted: number;
  mastered: number;
  mastery_percent: number;
  pending: PendingActions;
  streak: number;
  today_solved: number;
  subjects: SubjectSummary[];
  weak_chapters: WeakChapter[];
  calendar: DailyActivity[];
}

export interface PendingActions {
  doubts_pending: number;
  mistakes_pending: number;
  revision_pending: number;
  today_solved: number;
  streak: number;
}

export interface SubjectSummary {
  id: string;
  name: string;
  slug: string;
  total_questions: number;
  attempted: number;
  mastered: number;
  mastery_percent: number;
  chapters_count: number;
}

export interface ChapterSummary {
  id: string;
  name: string;
  slug: string;
  total_questions: number;
  attempted: number;
  remaining: number;
  mastered: number;
  mastery_percent: number;
  accuracy_percent: number;
}

export interface CategoryBucketStats {
  key: string;
  label: string;
  category_id: string;
  category_slug: string;
  difficulty: DifficultyLevel | null;
  group: "module" | "created_by_teacher";
  total: number;
  attempted: number;
  remaining: number;
  correct_count: number;
  accuracy_percent: number;
  progress_percent: number;
}

export interface ChapterAnalytics {
  chapter_id: string;
  chapter_name: string;
  subject_id: string;
  subject_name: string;
  module: CategoryBucketStats[];
  created_by_teacher: CategoryBucketStats[];
}

export interface QuestionListItem {
  id: string;
  question_text: string;
  question_type: QuestionType;
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  chapter_name: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  difficulty: DifficultyLevel | null;
  status: QuestionStatus;
  total_attempts: number;
  last_attempted_at: string | null;
  doubt_marked_at: string | null;
  doubt_resolved: boolean;
  revision_saved_at: string | null;
  latest_correct: boolean | null;
}

export interface WeakChapter {
  chapter_id: string;
  chapter_name: string;
  subject_name: string;
  subject_slug: string;
  accuracy_percent: number;
  doubt_count: number;
  mistake_count: number;
  avg_time_seconds: number;
  weakness_score: number;
}

export interface DailyActivity {
  date: string;
  total: number;
  correct: number;
  wrong: number;
}

export interface TeacherNotification {
  id: string;
  student_id: string;
  student_name: string;
  teacher_id: string;
  question_id: string;
  message: string;
  chapter_name: string | null;
  read: boolean;
  created_at: string;
}

export type MistakeFilter = "recent" | "repeated" | "chapter";
