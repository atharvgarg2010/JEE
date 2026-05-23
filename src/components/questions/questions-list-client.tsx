"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/questions/question-card";
import {
  QuestionFilters,
  emptyFilters,
  type QuestionFilterValues,
} from "@/components/questions/question-filters";
import type {
  Chapter,
  QuestionCategory,
  QuestionWithRelations,
  Subject,
} from "@/types/questions";

export function QuestionsListClient() {
  const [filters, setFilters] = useState<QuestionFilterValues>(emptyFilters);
  const [questions, setQuestions] = useState<QuestionWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.subjectId) params.set("subjectId", filters.subjectId);
    if (filters.chapterId) params.set("chapterId", filters.chapterId);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.questionType) params.set("questionType", filters.questionType);

    const res = await fetch(`/api/teacher/questions?${params}`);
    const data = await res.json();
    if (data.success) {
      setQuestions(data.questions);
      setTotal(data.total);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch("/api/teacher/metadata")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSubjects(data.subjects);
          setCategories(data.categories);
        }
      });
  }, []);

  useEffect(() => {
    if (filters.subjectId) {
      fetch(`/api/teacher/metadata?subjectId=${filters.subjectId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setChapters(data.chapters);
        });
    } else {
      fetch("/api/teacher/metadata")
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setChapters(data.chapters);
        });
    }
  }, [filters.subjectId]);

  useEffect(() => {
    const timer = setTimeout(fetchQuestions, 300);
    return () => clearTimeout(timer);
  }, [fetchQuestions]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/teacher/questions/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) await fetchQuestions();
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Question bank</h1>
          <p className="mt-1 text-zinc-400">
            {total} question{total !== 1 ? "s" : ""} in your library
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/questions/new">
            <Plus className="h-4 w-4" />
            Create question
          </Link>
        </Button>
      </div>

      <QuestionFilters
        values={filters}
        subjects={subjects}
        chapters={chapters}
        categories={categories}
        onChange={setFilters}
        onReset={() => setFilters(emptyFilters)}
      />

      {loading ? (
        <div className="py-16 text-center text-zinc-500">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 py-16 text-center">
          <p className="text-zinc-400">No questions found.</p>
          <Button className="mt-4" asChild>
            <Link href="/teacher/questions/new">Create your first question</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onDelete={handleDelete}
              deleting={deletingId === q.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
