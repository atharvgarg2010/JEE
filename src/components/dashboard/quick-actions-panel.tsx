"use client";

import { useState } from "react";
import {
  FileText,
  Megaphone,
  TrendingDown,
  Users,
  X,
} from "lucide-react";

const ACTION_DETAILS: Record<string, { title: string; desc: string }> = {
  "create-test": {
    title: "Create Test",
    desc: "Design and publish new tests",
  },
  announcement: {
    title: "Send Announcement",
    desc: "Communicate with students",
  },
  "weak-topics": {
    title: "View Weak Topics",
    desc: "Identify areas needing focus",
  },
  "in-class": {
    title: "Take In Class",
    desc: "Conduct live sessions",
  },
};

export function QuickActionsPanel() {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const actions = [
    {
      id: "create-test",
      title: "Create Test",
      desc: "Design and publish new tests",
      icon: FileText,
      accent: "from-violet-500/20 to-violet-600/10",
      textColor: "text-violet-300",
      borderColor: "border-violet-500/20 hover:border-violet-500/40",
    },
    {
      id: "announcement",
      title: "Send Announcement",
      desc: "Communicate with students",
      icon: Megaphone,
      accent: "from-fuchsia-500/20 to-fuchsia-600/10",
      textColor: "text-fuchsia-300",
      borderColor: "border-fuchsia-500/20 hover:border-fuchsia-500/40",
    },
    {
      id: "weak-topics",
      title: "View Weak Topics",
      desc: "Identify areas needing focus",
      icon: TrendingDown,
      accent: "from-amber-500/20 to-amber-600/10",
      textColor: "text-amber-300",
      borderColor: "border-amber-500/20 hover:border-amber-500/40",
    },
    {
      id: "in-class",
      title: "Take In Class",
      desc: "Conduct live sessions",
      icon: Users,
      accent: "from-cyan-500/20 to-cyan-600/10",
      textColor: "text-cyan-300",
      borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
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
        {actions.map(({ id, title, desc, icon: Icon, accent, textColor, borderColor }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveAction(id)}
            className={`group rounded-xl border bg-gradient-to-br p-4 transition-all ${borderColor} ${accent} hover:scale-105 hover:shadow-lg hover:shadow-violet-500/10`}
          >
            <div className={`mb-3 inline-block p-2 rounded-lg bg-zinc-800/40 group-hover:bg-zinc-800/60 transition-colors`}>
              <Icon className={`h-5 w-5 ${textColor}`} />
            </div>
            <h3 className="font-semibold text-white text-left text-sm">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1 text-left">{desc}</p>
          </button>
        ))}
      </div>

      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="mx-auto w-full max-w-lg rounded-3xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-violet-400">Coming soon</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {ACTION_DETAILS[activeAction]?.title ?? "Coming Soon"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              {ACTION_DETAILS[activeAction]?.desc ?? "This feature is not available yet."} It will be available soon in the Teacher Dashboard.
            </p>
            <div className="mt-6 text-right">
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
