"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  Megaphone,
  TrendingDown,
  Users,
} from "lucide-react";

interface Action {
  id: string;
  title: string;
  desc: string;
  icon: typeof Megaphone;
  accent: string;
  textColor: string;
  borderColor: string;
  href: string | null;
}

export function QuickActionsPanel() {
  const router = useRouter();

  const actions: Action[] = [
    {
      id: "create-test",
      title: "Create Test",
      desc: "Design and publish new tests",
      icon: FileText,
      accent: "from-violet-500/20 to-violet-600/10",
      textColor: "text-violet-300",
      borderColor: "border-violet-500/20 hover:border-violet-500/40",
      href: null,
    },
    {
      id: "announcement",
      title: "Send Announcement",
      desc: "Broadcast a notice to your batches",
      icon: Megaphone,
      accent: "from-fuchsia-500/20 to-fuchsia-600/10",
      textColor: "text-fuchsia-300",
      borderColor: "border-fuchsia-500/20 hover:border-fuchsia-500/40",
      href: "/teacher/announcements",
    },
    {
      id: "weak-topics",
      title: "View Weak Topics",
      desc: "Identify areas needing focus",
      icon: TrendingDown,
      accent: "from-amber-500/20 to-amber-600/10",
      textColor: "text-amber-300",
      borderColor: "border-amber-500/20 hover:border-amber-500/40",
      href: null,
    },
    {
      id: "in-class",
      title: "Take In Class",
      desc: "Conduct live sessions",
      icon: Users,
      accent: "from-cyan-500/20 to-cyan-600/10",
      textColor: "text-cyan-300",
      borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
      href: null,
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Access frequently used features
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(({ id, title, desc, icon: Icon, accent, textColor, borderColor, href }) => (
          <button
            key={id}
            type="button"
            onClick={() => { if (href) router.push(href); }}
            disabled={!href}
            className={`group rounded-xl border bg-gradient-to-br p-4 transition-all ${borderColor} ${accent} ${href ? "cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-violet-500/10" : "cursor-default opacity-50"}`}
          >
            <div className="mb-3 inline-block rounded-lg bg-zinc-800/40 p-2 transition-colors group-hover:bg-zinc-800/60">
              <Icon className={`h-5 w-5 ${textColor}`} />
            </div>
            <h3 className="font-semibold text-white text-left text-sm">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1 text-left">{desc}</p>
            {!href && (
              <p className="mt-1 text-xs text-zinc-600">Coming soon</p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
