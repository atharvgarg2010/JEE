import Link from "next/link";
import {
  GraduationCap,
  UserPlus,
  LogIn,
  BookOpenCheck,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/25 via-zinc-950 to-zinc-950"
        aria-hidden
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-violet-400" />
          <span className="text-lg font-semibold text-white">JEE Tracker</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login/student">Student</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login/teacher">Teacher</Link>
          </Button>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-20 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-sm text-violet-300">
            <BookOpenCheck className="h-4 w-4" />
            JEE Preparation Platform
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Track progress.{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Ace the exam.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
            Secure role-based access for students, teachers, and admins — built
            with custom authentication on Supabase PostgreSQL.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                <UserPlus />
                Student signup
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login/student">
                <LogIn />
                Student login
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login/teacher">Teacher login</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              title: "Students",
              desc: "Signup with roll number & batch code",
              href: "/signup",
            },
            {
              title: "Teachers",
              desc: "Manage batches and assignments",
              href: "/login/teacher",
            },
            {
              title: "Admins",
              desc: "Platform configuration & users",
              href: "/login/admin",
              icon: Shield,
            },
          ].map(({ title, desc, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 transition-colors hover:border-violet-500/40 hover:bg-zinc-900/70"
            >
              {Icon && (
                <Icon className="mb-3 h-5 w-5 text-violet-400 transition-transform group-hover:scale-110" />
              )}
              <h2 className="font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
