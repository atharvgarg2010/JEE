import { getCurrentUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api/response";
import type { PublicUser } from "@/types/user";

export async function requireAdmin(): Promise<
  PublicUser | ReturnType<typeof jsonError>
> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "admin") return jsonError("Forbidden", 403);
  return user;
}

export function isAdminUser(
  user: PublicUser | ReturnType<typeof jsonError>,
): user is PublicUser {
  return "id" in user && user.role === "admin";
}
