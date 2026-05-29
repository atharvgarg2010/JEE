import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie, getRedirectPathForRole } from "@/lib/auth/session";
import { jsonSuccess, jsonError } from "@/lib/api/response";
import {
  createStudent,
  rollNumberExists,
  toPublicUser,
  usernameExists,
} from "@/lib/db/users";
import { studentSignupSchema } from "@/lib/validations/auth";
import { withApiErrorHandler, RateLimitError } from "@/lib/api/error";
import { rateLimit } from "@/lib/api/rate-limit";
import { verifyCsrf } from "@/lib/api/csrf";
import { parseRequestBody } from "@/lib/api/validation";
import { z } from "zod";

const schema = z.object({
  fullName: z.string(),
  username: z.string().transform(val => val.toLowerCase()),
  rollNumber: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
}).and(studentSignupSchema);

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    // Strict rate limit for signups: 3 per hour
    rateLimit(req, { limit: 3, windowMs: 60 * 60 * 1000, identifier: `signup_student:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const data = await parseRequestBody(req, schema);
    const { fullName, username, rollNumber, password } = data;

    if (await usernameExists(username)) {
      return jsonError("Username is already taken", 409);
    }

    if (await rollNumberExists(rollNumber)) {
      return jsonError("Roll number is already registered", 409);
    }

    const password_hash = await hashPassword(password);
    const user = await createStudent({
      full_name: fullName,
      username,
      roll_number: rollNumber,
      password_hash,
    });

    await setSessionCookie({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return jsonSuccess({
      user: toPublicUser(user),
      redirectTo: getRedirectPathForRole(user.role),
    }, 201);
  }, request);
}
