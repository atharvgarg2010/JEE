import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeacherNotificationsDrawer } from "@/components/teacher/teacher-notifications-drawer";
import { getCurrentUser } from "@/lib/auth/session";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "teacher") {
    redirect("/login/teacher");
  }

  return (
    <DashboardShell
      user={user}
      wide
      navItems={[
        { href: "/teacher/dashboard", label: "Dashboard" },
        { href: "/teacher/questions", label: "Questions" },
        { href: "/teacher/questions/new", label: "Create" },
        { href: "/teacher/batches", label: "My Batches" },
        { href: "/teacher/students", label: "Students" },
        { href: "/teacher/announcements", label: "Announce" },
      ]}
      extraActions={<TeacherNotificationsDrawer />}
    >
      {children}
    </DashboardShell>
  );
}
