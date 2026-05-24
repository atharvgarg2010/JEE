import { cookies } from "next/headers";
import { ROLE_HOME, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/constants";
import { createSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { findUserById } from "@/lib/db/users";
import type { PublicUser, SessionPayload } from "@/types/user";

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await findUserById(session.sub);
  if (!user) return null;

  return {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    roll_number: user.roll_number,
    batch_code: user.batch_code,
    subject: user.subject,
    teacher_code: user.teacher_code,
    experience: user.experience,
    role: user.role,
  };
}

export function getRedirectPathForRole(role: string): string {
  return ROLE_HOME[role] ?? "/";
}
