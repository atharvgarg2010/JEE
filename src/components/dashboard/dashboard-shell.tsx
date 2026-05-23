import Link from "next/link";
import { GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicUser } from "@/types/user";

interface DashboardShellProps {
  user: PublicUser;
  children: React.ReactNode;
  navItems?: { href: string; label: string }[];
  wide?: boolean;
}

export function DashboardShell({
  user,
  children,
  navItems = [],
  wide = false,
}: DashboardShellProps) {
  const maxWidth = wide ? "max-w-7xl" : "max-w-6xl";
  const displayName = user.full_name ?? user.username;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className={`mx-auto flex h-16 ${maxWidth} items-center justify-between px-4`}>
          <div className="flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-violet-400" />
            <div>
              <p className="text-sm font-semibold text-white">JEE Tracker</p>
              <p className="text-xs capitalize text-zinc-500">{user.role} portal</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-zinc-400 transition-colors hover:text-violet-300"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-zinc-500">@{user.username}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <Button type="submit" variant="secondary" size="sm">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className={`mx-auto ${maxWidth} px-4 py-8`}>{children}</main>
    </div>
  );
}
