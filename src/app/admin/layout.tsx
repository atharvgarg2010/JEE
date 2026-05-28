import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/login/admin");
  }

  return (
    <DashboardShell
      user={user}
      navItems={[
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/batches", label: "Batches" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/analytics", label: "Analytics" },
        { href: "/admin/modules", label: "Modules" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
