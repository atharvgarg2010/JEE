import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie, getRedirectPathForRole } from "@/lib/auth/session";
import { jsonError, jsonSuccess, zodErrorMessage } from "@/lib/api/response";
import {
  createStudent,
  rollNumberExists,
  toPublicUser,
  usernameExists,
} from "@/lib/db/users";
import { studentSignupSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = studentSignupSchema.safeParse({
      fullName: body.fullName,
      username: body.username?.toLowerCase?.() ?? body.username,
      rollNumber: body.rollNumber,
      batchCode: body.batchCode,
      password: body.password,
      confirmPassword: body.confirmPassword,
    });

    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const { fullName, username, rollNumber, batchCode, password } = parsed.data;

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
      batch_code: batchCode,
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
    });
  } catch (error) {
    console.error("[signup]", error);
    return jsonError("Unable to create account. Please try again.", 500);
  }
}
