"use client";

import { cn } from "@/lib/utils";
import type { PracticeFilter } from "@/types/questions";

const FILTERS: { id: PracticeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "not_attempted", label: "Not attempted" },
  { id: "attempted", label: "Attempted" },
  { id: "doubts", label: "Doubts" },
  { id: "revision", label: "Revision" },
  { id: "mastered", label: "Mastered" },
];

interface PracticeFiltersProps {
  value: PracticeFilter;
  onChange: (filter: PracticeFilter) => void;
}

export function PracticeFilters({ value, onChange }: PracticeFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
            value === f.id
              ? "border-violet-500/50 bg-violet-500/20 text-violet-200 shadow-lg shadow-violet-900/20"
              : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
