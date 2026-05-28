"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNavDrawer } from "@/components/dashboard/mobile-nav-drawer";
import type { PublicUser } from "@/types/user";
import type { ReactNode } from "react";

interface DashboardShellProps {
  user: PublicUser;
  children: React.ReactNode;
  navItems?: { href: string; label: string }[];
  extraActions?: ReactNode;
  wide?: boolean;
}

export function DashboardShell({
  user,
  children,
  navItems = [],
  extraActions,
  wide = false,
}: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const maxWidth = wide ? "max-w-7xl" : "max-w-6xl";
  const displayName = user.full_name ?? user.username;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950">
        <div className={`mx-auto flex h-16 ${maxWidth} items-center justify-between px-4`}>
          <div className="flex items-center gap-3">
            {/* Hamburger (Mobile only) */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="mr-2 block md:hidden rounded-md p-2 -ml-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open Menu</span>
            </button>
            <GraduationCap className="hidden sm:block h-7 w-7 text-violet-400" />
            <div>
              <p className="text-sm font-semibold text-white">JEE Tracker</p>
              <p className="hidden sm:block text-xs capitalize text-zinc-500">{user.role} portal</p>
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
            {extraActions}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-zinc-500">@{user.username}</p>
            </div>
            <form action="/api/auth/logout" method="POST" className="hidden md:block">
              <Button type="submit" variant="secondary" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={drawerOpen}
        setOpen={setDrawerOpen}
        user={user}
        navItems={navItems}
        // extraActions could theoretically go in the drawer, but teacher notifications drawer is its own icon
      />

      {/* Changed py-8 to flex-1 py-6 md:py-8 to allow bottom nav to exist safely */}
      <main className={`mx-auto w-full flex-1 ${maxWidth} px-4 py-6 md:py-8`}>
        {children}
      </main>
    </div>
  );
}
