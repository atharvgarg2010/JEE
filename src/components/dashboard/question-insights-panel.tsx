"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionInsightCard } from "./question-insight-card";
import { QuestionInsightsPanelSkeleton } from "@/components/skeletons/dashboard-skeletons";
import type { DifficultyLevel, QuestionType } from "@/types/questions";

interface InsightQuestion {
  id: string;
  title: string;
  chapter: string;
  difficulty: DifficultyLevel | null;
  type: QuestionType;
  accuracy: number;
  wrongCount: number;
  solutionViews: number;
  doubtCount: number;
  attemptCount: number;
}

interface QuestionInsightsPanelProps {
  loading?: boolean;
}

interface QuestionInsightsResponse {
  insights: {
    mostWrong: InsightQuestion[];
    mostViewed: InsightQuestion[];
    highDoubt: InsightQuestion[];
    lowAccuracy: InsightQuestion[];
  };
}

export function QuestionInsightsPanel({ loading = false }: QuestionInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState("wrong");
  const [insights, setInsights] = useState<QuestionInsightsResponse["insights"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      setLoadingInsights(true);
      setError(null);

      try {
        const res = await fetch("/api/teacher/question-insights", {
          cache: "no-store",
          credentials: "include",
        });
        const data = (await res.json()) as QuestionInsightsResponse & { success?: boolean; error?: string };
        if (data.success === false) {
          setError(data.error ?? "Unable to load question insights");
          setInsights(null);
        } else {
          setInsights(data.insights ?? null);
        }
      } catch (err) {
        console.error("Failed to load question insights", err);
        setError("Unable to fetch insights");
      } finally {
        setLoadingInsights(false);
      }
    }

    loadInsights();
  }, []);

  if (loading || loadingInsights) {
    return <QuestionInsightsPanelSkeleton />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Question Insights</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Identify challenging questions and student pain points
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-900/50 border border-zinc-800/60 p-1 rounded-lg overflow-x-auto">
          <TabsTrigger value="wrong" className="text-xs">
            Most Wrong
          </TabsTrigger>
          <TabsTrigger value="viewed" className="text-xs">
            Most Viewed
          </TabsTrigger>
          <TabsTrigger value="doubt" className="text-xs">
            High Doubt
          </TabsTrigger>
          <TabsTrigger value="lowest" className="text-xs">
            Low Accuracy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wrong" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights?.mostWrong?.map((question) => (
              <QuestionInsightCard
                key={question.id}
                question={question}
                variant="wrong"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="viewed" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights?.mostViewed?.map((question) => (
              <QuestionInsightCard
                key={question.id}
                question={question}
                variant="viewed"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="doubt" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights?.highDoubt?.map((question) => (
              <QuestionInsightCard
                key={question.id}
                question={question}
                variant="doubt"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lowest" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights?.lowAccuracy?.map((question) => (
              <QuestionInsightCard
                key={question.id}
                question={question}
                variant="lowest"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center mt-4">
        <button
          type="button"
          disabled
          className="text-sm text-violet-400 opacity-60 cursor-not-allowed font-medium"
          title="Coming soon"
        >
          View detailed analytics →
        </button>
      </div>
    </section>
  );
}
