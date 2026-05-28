import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StudentBottomNav } from "@/components/dashboard/student-bottom-nav";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "student") {
    redirect("/login/student");
  }

  return (
    <>
      <DashboardShell
        user={user}
        wide
        navItems={[
          { href: "/student/dashboard", label: "Dashboard" },
          { href: "/student/explorer", label: "Explorer" },
          { href: "/student/mistakes", label: "Mistakes" },
          { href: "/student/doubts", label: "Doubts" },
          { href: "/student/revision", label: "Revision" },
          { href: "/student/practice", label: "Practice" },
          { href: "/student/announcements", label: "Notices" },
        ]}
      >
        {children}
      </DashboardShell>
      <StudentBottomNav />
    </>
  );
}
