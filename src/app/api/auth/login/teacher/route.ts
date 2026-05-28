import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, getRedirectPathForRole } from "@/lib/auth/session";
import { jsonSuccess } from "@/lib/api/response";
import { findUserWithPasswordByUsername, toPublicUser } from "@/lib/db/users";
import { teacherLoginSchema } from "@/lib/validations/auth";
import { withApiErrorHandler, UnauthorizedError } from "@/lib/api/error";
import { rateLimit, logSuspiciousFailedLogin } from "@/lib/api/rate-limit";
import { verifyCsrf } from "@/lib/api/csrf";
import { parseRequestBody } from "@/lib/api/validation";
import { z } from "zod";

// Create a strict schema wrapper that coerces username to lowercase as per original logic
const schema = z.object({
  username: z.string().transform(val => val.toLowerCase()),
  password: z.string()
}).and(teacherLoginSchema);

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    rateLimit(req, { limit: 5, windowMs: 5 * 60 * 1000, identifier: `login_teacher:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const { username, password } = await parseRequestBody(req, schema);

    const user = await findUserWithPasswordByUsername(username, "teacher");

    if (!user) {
      logSuspiciousFailedLogin(`teacher:${username}`);
      throw new UnauthorizedError("Invalid username or password");
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      logSuspiciousFailedLogin(`teacher:${username}`);
      throw new UnauthorizedError("Invalid username or password");
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
  }, request);
}
