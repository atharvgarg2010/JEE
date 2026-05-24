"use client";

import { useCallback, useEffect, useState } from "react";
import { Compass, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExplorerTree } from "@/components/explorer/explorer-tree";
import { ExplorerPageSkeleton } from "@/components/skeletons/dashboard-skeletons";
import type {
  ExplorerSubjectNode,
  StudentQuestionWithAttempt,
} from "@/types/questions";

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store", credentials: "include" });
  const data = await res.json();
  if (!res.ok && !data.error) {
    return { success: false, error: `Request failed (${res.status})` };
  }
  return data;
}

export function QuestionExplorerClient() {
  const [tree, setTree] = useState<ExplorerSubjectNode[]>([]);
  const [questions, setQuestions] = useState<StudentQuestionWithAttempt[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<{
    subjectId: string;
    chapterId: string;
    categoryId: string;
    difficulty?: string;
    label: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchJson("/api/student/explorer/tree");
    if (data.success) {
      setTree(data.tree ?? []);
    } else {
      setError(data.error ?? "Failed to load explorer");
    }
    setLoading(false);
  }, []);

  const loadQuestions = useCallback(
    async (bucket: NonNullable<typeof selectedBucket>) => {
      setLoadingQuestions(true);
      const params = new URLSearchParams({
        subjectId: bucket.subjectId,
        chapterId: bucket.chapterId,
        categoryId: bucket.categoryId,
      });
      if (bucket.difficulty) params.set("difficulty", bucket.difficulty);

      const data = await fetchJson(
        `/api/student/practice/questions?${params.toString()}`,
      );
      if (data.success) {
        setQuestions(data.questions ?? []);
      } else {
        setError(data.error ?? "Failed to load questions");
        setQuestions([]);
      }
      setLoadingQuestions(false);
    },
    [],
  );

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (selectedBucket) loadQuestions(selectedBucket);
  }, [selectedBucket, loadQuestions]);

  function handleSelectBucket(bucket: typeof selectedBucket) {
    setSelectedBucket(bucket);
    if (bucket) loadQuestions(bucket);
  }

  if (loading) {
    return <ExplorerPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 via-zinc-900/80 to-zinc-950 p-8">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Compass className="h-10 w-10 shrink-0 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Question Explorer</h1>
              <p className="mt-2 max-w-xl text-zinc-400">
                Physics, Chemistry & Mathematics — organized by chapter, module
                categories, and teacher difficulty levels.
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={loadTree}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <ExplorerTree
        tree={tree}
        questions={questions}
        selectedBucket={selectedBucket}
        onSelectBucket={handleSelectBucket}
        loadingQuestions={loadingQuestions}
      />
    </div>
  );
}
