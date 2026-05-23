import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, getRedirectPathForRole } from "@/lib/auth/session";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { findUserWithPasswordByUsername, toPublicUser } from "@/lib/db/users";
import { teacherLoginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = teacherLoginSchema.safeParse({
      username: body.username?.toLowerCase?.() ?? body.username,
      password: body.password,
    });

    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { username, password } = parsed.data;
    const user = await findUserWithPasswordByUsername(username, "teacher");

    if (!user) {
      return jsonError("Invalid username or password", 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return jsonError("Invalid username or password", 401);
    }

    const publicUser = toPublicUser(user);

    await setSessionCookie({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return jsonSuccess({
      user: publicUser,
      redirectTo: getRedirectPathForRole(user.role),
    });
  } catch (error) {
    console.error("[teacher-login]", error);
    return jsonError("Login failed. Please try again.", 500);
  }
}
