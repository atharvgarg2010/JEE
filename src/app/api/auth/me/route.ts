import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/api/response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("Not authenticated", 401);
    }
    return jsonSuccess({ user });
  } catch (error) {
    console.error("[me]", error);
    return jsonError("Failed to fetch session", 500);
  }
}
