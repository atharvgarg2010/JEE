/**
 * DEV-ONLY: User registry for the developer account switcher.
 *
 * Replace the `id` values below with real user UUIDs from your local
 * development database. The panel will instantly switch to these accounts
 * by overwriting the session cookie via POST /api/dev/switch.
 *
 * This file is NEVER imported in production — it is only referenced by
 * the DevPanel component and /api/dev/switch, both of which are tree-shaken
 * or hard-blocked (NODE_ENV check) in production builds.
 */

export interface DevUser {
  /** Friendly label shown in the dev panel button */
  label: string;
  /** Real UUID from the `users` table in your dev DB */
  id: string;
  /** Role — used for color coding only */
  role: "student" | "teacher" | "admin";
  /** Optional description shown in the panel */
  description?: string;
}

/**
 * ⚠️  FILL IN REAL USER IDs FROM YOUR DEV DATABASE.
 *
 * Quick way to find them:
 *   SELECT id, username, role FROM users ORDER BY role, created_at LIMIT 20;
 */
export const DEV_USERS: DevUser[] = [
  {
    label: "Student 1",
    id: "REPLACE_WITH_STUDENT_1_UUID",
    role: "student",
    description: "Weak performer — low accuracy, high doubts",
  },
  {
    label: "Student 2",
    id: "REPLACE_WITH_STUDENT_2_UUID",
    role: "student",
    description: "Average performer",
  },
  {
    label: "Student 3",
    id: "REPLACE_WITH_STUDENT_3_UUID",
    role: "student",
    description: "Top performer",
  },
  {
    label: "Teacher 1",
    id: "REPLACE_WITH_TEACHER_1_UUID",
    role: "teacher",
    description: "Physics · Batch A",
  },
  {
    label: "Teacher 2",
    id: "REPLACE_WITH_TEACHER_2_UUID",
    role: "teacher",
    description: "Math teacher",
  },
  {
    label: "Admin",
    id: "REPLACE_WITH_ADMIN_UUID",
    role: "admin",
    description: "Full access",
  },
];

export const ROLE_COLORS: Record<DevUser["role"], string> = {
  student: "border-cyan-800 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50",
  teacher:
    "border-violet-800 bg-violet-950/40 text-violet-300 hover:bg-violet-900/50",
  admin:
    "border-amber-800 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50",
};

export const ROLE_HOME: Record<DevUser["role"], string> = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
};
