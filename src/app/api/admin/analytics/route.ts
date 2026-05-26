import { isAdminUser, requireAdmin } from "@/lib/auth/admin";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getAdminDashboardStats,
  getBatchPerformanceStats,
  getTeacherPerformanceStats,
  getStudentRankings,
  getWeakChaptersAcrossBatches,
  getTeacherLoadDistribution,
} from "@/lib/db/admin-analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics?view=dashboard|batches|teachers|students|chapters|load
 * Returns different analytics data based on the `view` query param.
 * Also accepts optional `?batchId=` for chapter filtering.
 */
export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!isAdminUser(user)) return user;

  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "dashboard";
  const batchId = url.searchParams.get("batchId") ?? undefined;
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50", 10));

  try {
    switch (view) {
      case "dashboard": {
        const stats = await getAdminDashboardStats();
        return jsonSuccess({ stats });
      }

      case "batches": {
        const batches = await getBatchPerformanceStats();
        return jsonSuccess({ batches });
      }

      case "teachers": {
        const [teachers, load] = await Promise.all([
          getTeacherPerformanceStats(),
          getTeacherLoadDistribution(),
        ]);
        return jsonSuccess({ teachers, load });
      }

      case "students": {
        const students = await getStudentRankings(limit);
        return jsonSuccess({ students });
      }

      case "chapters": {
        const chapters = await getWeakChaptersAcrossBatches(batchId);
        return jsonSuccess({ chapters });
      }

      case "load": {
        const load = await getTeacherLoadDistribution();
        return jsonSuccess({ load });
      }

      default:
        return jsonError(`Unknown view: ${view}`, 400);
    }
  } catch (error) {
    console.error(`[admin/analytics GET view=${view}]`, error);
    return jsonError("Failed to load analytics", 500);
  }
}
