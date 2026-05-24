"use client";

import { BatchCard } from "./batch-card";
import { teacherBatches } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BatchOverviewPanelSkeleton } from "@/components/skeletons/dashboard-skeletons";

interface BatchOverviewPanelProps {
  loading?: boolean;
}

export function BatchOverviewPanel({ loading = false }: BatchOverviewPanelProps) {
  const activeBatches = teacherBatches.filter((b) => b.status === "Active");

  if (loading) {
    return <BatchOverviewPanelSkeleton />;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Batch Overview</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Manage and monitor your student batches
          </p>
        </div>
        <Button size="sm" variant="secondary">
          <Plus className="h-4 w-4" />
          New Batch
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeBatches.map((batch) => (
          <BatchCard key={batch.id} batch={batch} />
        ))}
      </div>

      <div className="text-center">
        <button className="text-sm text-zinc-500 hover:text-zinc-400 font-medium">
          View all batches ({teacherBatches.length}) →
        </button>
      </div>
    </section>
  );
}
