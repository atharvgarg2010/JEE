"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, HelpCircle, Megaphone, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentBottomNav() {
  const pathname = usePathname();

  // Hide entirely in practice zone as requested
  if (pathname.includes("/practice") || pathname.includes("/explorer")) {
    return null;
  }

  const navItems = [
    { href: "/student/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/student/doubts", label: "Doubts", icon: HelpCircle },
    { href: "/student/announcements", label: "Notices", icon: Megaphone },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the fixed bottom nav */}
      <div className="h-20 md:hidden" />

      {/* Fixed Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around bg-zinc-950 border-t border-zinc-800 pb-[env(safe-area-inset-bottom)] md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors",
                isActive ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "opacity-100" : "opacity-80")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
