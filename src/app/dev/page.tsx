import { redirect } from "next/navigation";
import { ROLE_HOME } from "@/lib/dev/dev-users";

/**
 * DEV-ONLY: URL-based account switcher.
 *
 * Usage: /dev?userId=<uuid>
 *
 * This page server-side POSTs to /api/dev/switch, then redirects
 * to the correct dashboard. Works for bookmarking specific dev users.
 *
 * Hard-redirects to home in production.
 */
interface DevPageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function DevPage({ searchParams }: DevPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
        <h1 className="text-lg font-bold text-zinc-100">Dev mode is disabled</h1>
        <p className="mt-2 text-sm text-zinc-400">
          User switching is currently turned off.
        </p>
      </div>
    </div>
  );
}
