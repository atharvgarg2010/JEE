import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, getRedirectPathForRole } from "@/lib/auth/session";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import { findUserByIdentifier, toPublicUser } from "@/lib/db/users";
import { studentLoginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = studentLoginSchema.safeParse({
      identifier: body.identifier,
      password: body.password,
    });

    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { identifier, password } = parsed.data;
    const user = await findUserByIdentifier(identifier);

    if (!user || user.role !== "student") {
      return jsonError("Invalid username/roll number or password", 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return jsonError("Invalid username/roll number or password", 401);
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
    console.error("[student-login]", error);
    return jsonError("Login failed. Please try again.", 500);
  }
}
