"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/types/user";

interface MobileNavDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: PublicUser;
  navItems: { href: string; label: string }[];
  extraActions?: React.ReactNode;
}

export function MobileNavDrawer({
  open,
  setOpen,
  user,
  navItems,
  extraActions,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const displayName = user.full_name ?? user.username;

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, setOpen]);

  return (
    <>
      {/* Backdrop (no blur per user request) */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-[85vw] sm:w-80 flex-col bg-zinc-950 border-r border-zinc-800 transition-transform duration-150 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-violet-400" />
            <div>
              <p className="text-sm font-semibold text-white">JEE Tracker</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-violet-500/10 text-violet-300"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          {extraActions && (
            <div className="mt-6 border-t border-zinc-800/50 pt-6 px-1">
              {extraActions}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 p-4">
          <div className="mb-4">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-zinc-500">@{user.username}</p>
            <p className="mt-1 text-xs uppercase text-violet-400 font-semibold tracking-wider">
              {user.role}
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="secondary" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
