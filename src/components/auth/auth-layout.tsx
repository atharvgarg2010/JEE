import Link from "next/link";
import { GraduationCap } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-zinc-950 to-zinc-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-zinc-400 transition-colors hover:text-violet-300"
        >
          <GraduationCap className="h-8 w-8 text-violet-400" />
          <span className="text-lg font-semibold tracking-tight text-white">
            JEE Tracker
          </span>
        </Link>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
