import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
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
      ]}
    >
      {children}
    </DashboardShell>
  );
}
