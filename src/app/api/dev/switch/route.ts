import { NextResponse } from "next/server";
import { findUserById } from "@/lib/db/users";
import { setSessionCookie } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/dev/dev-users";

/**
 * DEV-ONLY: POST /api/dev/switch
 *
 * Finds a user by ID from the database, generates a real JWT session token
 * using the exact same logic as the login routes, and overwrites the existing
 * jee_session cookie — resulting in an instant account switch with zero
 * logout/login friction.
 *
 * Hard-blocked in production via NODE_ENV check.
 */
export async function POST(request: Request) {
  return NextResponse.json({ error: "Dev switching is currently disabled." }, { status: 403 });
}
