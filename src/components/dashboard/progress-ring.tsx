"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
  accent?: string;
}

export function ProgressRing({
  value,
  size = 72,
  stroke = 6,
  label,
  className,
  accent = "stroke-cyan-400",
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(accent, "transition-all duration-700")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-white">{value}%</span>
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
