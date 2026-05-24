export type QuestionType = "mcq" | "integer";
export type DifficultyLevel = "easy" | "medium" | "hard";

export type QuestionStatus =
  | "NOT_STARTED"
  | "CORRECT"
  | "WRONG"
  | "DOUBT"
  | "REVISION"
  | "MASTERED"
  | "REATTEMPT";

export interface McqOption {
  id: string;
  text: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface QuestionCategory {
  id: string;
  name: string;
  slug: string;
  supports_difficulty: boolean;
  sort_order: number;
}

export type QuestionCorrectAnswer = string | number;

export interface Question {
  id: string;
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
  created_at: string;
  updated_at: string;
}

export interface QuestionWithRelations extends Question {
  subject_name: string;
  chapter_name: string;
  category_name: string;
  category_slug: string;
}

export interface QuestionAttempt {
  id: string;
  student_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  attempt_number: number;
  time_taken_seconds: number;
  attempted_at: string;
  doubt_marked: boolean;
  viewed_solution: boolean;
  reattempt_required: boolean;
  saved_for_revision: boolean;
}

export interface StudentQuestionProgress {
  student_id: string;
  question_id: string;
  status: QuestionStatus;
  doubt_marked: boolean;
  doubt_resolved: boolean;
  saved_for_revision: boolean;
  solution_view_count: number;
  total_attempts: number;
  last_attempted_at: string | null;
  doubt_marked_at: string | null;
  revision_saved_at: string | null;
}

export interface SolutionViewRecord {
  id: string;
  attempt_number_at_view: number | null;
  view_context: string;
  viewed_at: string;
}

export interface StudentQuestionPublic {
  id: string;
  subject_id: string;
  chapter_id: string;
  category_id: string;
  difficulty: DifficultyLevel | null;
  question_type: QuestionType;
  question_text: string;
  options: McqOption[] | null;
  tags: string[];
  subject_name: string;
  chapter_name: string;
  category_name: string;
  category_slug?: string;
}

export interface StudentQuestionWithAttempt extends StudentQuestionPublic {
  progress: StudentQuestionProgress | null;
  latest_attempt: QuestionAttempt | null;
  status: QuestionStatus;
}

/** Explorer tree types */
export interface ExplorerLeaf {
  key: string;
  label: string;
  categoryId?: string;
  difficulty?: DifficultyLevel;
  questionCount: number;
}

export interface ExplorerModuleGroup {
  label: string;
  items: ExplorerLeaf[];
}

export interface ExplorerChapterNode {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
  module: ExplorerModuleGroup;
  createdByTeacher: ExplorerLeaf[];
}

export interface ExplorerSubjectNode {
  id: string;
  name: string;
  slug: string;
  questionCount: number;
  chapters: ExplorerChapterNode[];
}

export type PracticeFilter =
  | "all"
  | "attempted"
  | "not_attempted"
  | "doubts"
  | "revision"
  | "mastered"
  | "wrong";

export interface CategoryProgress {
  category_id: string;
  category_name: string;
  category_slug: string;
  total: number;
  attempted: number;
  remaining: number;
  mastered: number;
  mastery_percent: number;
}

export interface ChapterProgress {
  chapter_id: string;
  chapter_name: string;
  categories: CategoryProgress[];
  total: number;
  attempted: number;
  remaining: number;
  mastered: number;
  mastery_percent: number;
}

export interface TeacherQuestionStats {
  total_questions: number;
  mcq_count: number;
  integer_count: number;
  by_category: { name: string; count: number }[];
}
