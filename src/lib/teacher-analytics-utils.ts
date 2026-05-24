import type { TeacherStudentProfile } from "@/types/teacher-analytics";

const INACTIVE_DAYS = 7;

export function getTeacherStudentStatusBadge(
  student: TeacherStudentProfile,
): "🔥 Excellent" | "⚠️ Needs Help" | "📈 Improving" | "😴 Inactive" {
  if (student.daysInactive !== null && student.daysInactive >= INACTIVE_DAYS) {
    return "😴 Inactive";
  }
  if (student.improvement !== null && student.improvement >= 10) {
    return "📈 Improving";
  }
  if (student.accuracy >= 80 || student.masteryPercent >= 50) {
    return "🔥 Excellent";
  }
  if (student.accuracy < 55 || student.mistakesPending >= 3) {
    return "⚠️ Needs Help";
  }
  return "📈 Improving";
}
