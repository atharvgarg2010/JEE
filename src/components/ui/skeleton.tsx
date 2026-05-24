import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Use circular shape (avatars, icons) */
  circle?: boolean;
}

export function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-zinc-800/70",
        circle ? "rounded-full" : "rounded-md",
        "animate-pulse",
        "before:pointer-events-none before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_1.8s_ease-in-out_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-violet-500/12 before:to-fuchsia-500/8",
        className,
      )}
      {...props}
    />
  );
}
