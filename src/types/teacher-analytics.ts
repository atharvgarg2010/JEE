/** Real student metrics for teacher analytics (scoped to teacher's questions). */
export interface TeacherStudentProfile {
  id: string;
  name: string;
  accuracy: number;
  questionsAttempted: number;
  masteryPercent: number;
  currentStreak: number;
  doubtsCount: number;
  mistakesPending: number;
  daysInactive: number | null;
  improvement: number | null;
  previousAccuracy: number | null;
  lastAttemptedAt: string | null;
}

export interface TeacherStudentAnalyticsBuckets {
  top: TeacherStudentProfile[];
  weak: TeacherStudentProfile[];
  improving: TeacherStudentProfile[];
  inactive: TeacherStudentProfile[];
}
