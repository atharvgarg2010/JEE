"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface PracticeTimerProps {
  running: boolean;
  resetKey?: string;
  onTick?: (seconds: number) => void;
}

export function PracticeTimer({ running, resetKey, onTick }: PracticeTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (seconds > 0) {
      onTick?.(seconds);
    }
  }, [seconds, onTick]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-2 font-mono text-sm">
      <Clock className="h-4 w-4 text-violet-400" />
      <span className="text-zinc-300">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
