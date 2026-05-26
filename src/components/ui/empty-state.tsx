import React from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-lg border border-zinc-800/50 bg-zinc-900/20",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/50 mb-4 text-zinc-400">
        {icon ?? <Info className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-zinc-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
