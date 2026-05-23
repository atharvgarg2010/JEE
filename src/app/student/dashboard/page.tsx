import { StudentDashboardClient } from "@/components/dashboard/student-dashboard-client";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Student Dashboard | JEE Tracker",
};

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.full_name?.split(" ")[0] ?? user?.username ?? "Student";

  return <StudentDashboardClient userName={firstName} />;
}
