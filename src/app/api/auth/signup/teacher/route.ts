import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie, getRedirectPathForRole } from "@/lib/auth/session";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import {
  createTeacher,
  toPublicUser,
  usernameExists,
} from "@/lib/db/users";
import { teacherSignupSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = teacherSignupSchema.safeParse({
      fullName: body.fullName,
      username: body.username?.toLowerCase?.() ?? body.username,
      password: body.password,
      confirmPassword: body.confirmPassword,
      subject: body.subject,
      teacherCode: body.teacherCode,
      experience: body.experience,
    });

    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { fullName, username, password, subject, teacherCode, experience } =
      parsed.data;

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
    });
  } catch (error) {
    console.error("[teacher-signup]", error);
    return jsonError("Unable to create account. Please try again.", 500);
  }
}
