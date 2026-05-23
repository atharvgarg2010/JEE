export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  full_name: string | null;
  username: string;
  roll_number: string | null;
  batch_code: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SessionPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export interface PublicUser {
  id: string;
  full_name: string | null;
  username: string;
  roll_number: string | null;
  batch_code: string | null;
  role: UserRole;
}
