export const SESSION_COOKIE = "jee_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const ROLE_HOME: Record<string, string> = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
};

export const ROLE_LOGIN: Record<string, string> = {
  student: "/login/student",
  teacher: "/login/teacher",
  admin: "/login/admin",
};
