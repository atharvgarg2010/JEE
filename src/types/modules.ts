/**
 * Types for the Offline Module Question Logging System.
 * This system is SEPARATE from the platform question engine.
 * It tracks coaching module/DPP progress without rendering question content.
 */

export type QuestionStatus = "done" | "doubt" | "revision" | "not_done";

export interface Subject {
  id: string;
  name: string;
  created_at?: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  subject_name?: string; // Often joined
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ModuleSet {
  id: string;
  chapter_id: string | null;
  subject: string;
  chapter: string;
  module_name: string;
  question_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleQuestionLog {
  id: string;
  student_id: string;
  module_set_id: string;
  question_number: number;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
}

export interface ModuleDoubtNotification {
  id: string;
  student_id: string;
  student_name: string;
  module_set_id: string;
  module_name: string;
  subject: string;
  chapter: string;
  question_number: number;
  status: "doubt" | "revision";
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * API response shape for module logs endpoint.
 * Includes pre-computed analytics to reduce frontend recomputation.
 */
export interface ModuleLogsResponse {
  logs: ModuleQuestionLog[];
  analytics: ModuleAnalytics;
}

export interface ModuleAnalytics {
  done: number;
  doubt: number;
  revision: number;
  not_done: number;
  total: number;
  completion_pct: number;
}

/**
 * Filter params for teacher module doubts endpoint.
 * All fields optional — ready for future UI exposure.
 */
export interface ModuleDoubtFilters {
  subject?: string;
  chapter?: string;
  module_set_id?: string;
  status?: "doubt" | "revision";
  resolved?: boolean;
}

/**
 * Per-module aggregated analytics row for a single student.
 * Computed entirely in SQL — no frontend aggregation needed.
 * Returned by /api/teacher/students/[studentId]/module-analytics
 */
export interface StudentModuleAnalyticsRow {
  module_set_id: string;
  subject: string;
  chapter: string;
  module_name: string;
  question_count: number;
  attempted_questions: number; // For consistency/workload analytics
  done: number;
  doubt: number;
  revision: number;
  pending: number;
  completion_pct: number;  // 0–100, rounded to 1 decimal
  open_doubts: number;     // unresolved doubt notifications
  last_updated: string | null;
}

