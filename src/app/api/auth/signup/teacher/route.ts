import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie, getRedirectPathForRole } from "@/lib/auth/session";
import { jsonSuccess, jsonError } from "@/lib/api/response";
import {
  createTeacher,
  toPublicUser,
  usernameExists,
} from "@/lib/db/users";
import { teacherSignupSchema } from "@/lib/validations/auth";
import { withApiErrorHandler } from "@/lib/api/error";
import { rateLimit } from "@/lib/api/rate-limit";
import { verifyCsrf } from "@/lib/api/csrf";
import { parseRequestBody } from "@/lib/api/validation";
import { z } from "zod";

const schema = z.object({
  fullName: z.string(),
  username: z.string().transform(val => val.toLowerCase()),
  password: z.string(),
  confirmPassword: z.string(),
  subject: z.string(),
  teacherCode: z.string().optional(),
  experience: z.coerce.number().optional(),
}).and(teacherSignupSchema);

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    // Strict rate limit for signups: 3 per hour
    rateLimit(req, { limit: 3, windowMs: 60 * 60 * 1000, identifier: `signup_teacher:${req.headers.get("x-forwarded-for") || "unknown"}` });

    const data = await parseRequestBody(req, schema);
    const { fullName, username, password, subject, teacherCode, experience } = data;

    if (await usernameExists(username)) {
      return jsonError("username: Username is already taken", 409);
    }

    const password_hash = await hashPassword(password);
    const user = await createTeacher({
      full_name: fullName,
      username,
      password_hash,
      subject,
      teacher_code: teacherCode ?? null,
      experience: experience ?? null,
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
