import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, getRedirectPathForRole } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { findUserByIdentifier, toPublicUser } from "@/lib/db/users";
import { studentLoginSchema } from "@/lib/validations/auth";
import { withApiErrorHandler, UnauthorizedError } from "@/lib/api/error";
import { rateLimit, logSuspiciousFailedLogin } from "@/lib/api/rate-limit";
import { verifyCsrf } from "@/lib/api/csrf";
import { parseRequestBody } from "@/lib/api/validation";

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    // Strict rate limit for logins: 5 requests per 5 minutes
    rateLimit(req, { limit: 5, windowMs: 5 * 60 * 1000, identifier: `login_student:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const data = await parseRequestBody(req, studentLoginSchema);
    
    // Convert generic identifier to roll_number / username search format
    const identifier = data.identifier;
    const password = data.password;

    const user = await findUserByIdentifier(identifier);

    if (!user || user.role !== "student") {
      logSuspiciousFailedLogin(`student:${identifier}`);
      throw new UnauthorizedError("Invalid username/roll number or password");
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      logSuspiciousFailedLogin(`student:${identifier}`);
      throw new UnauthorizedError("Invalid username/roll number or password");
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
