"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type {
  Chapter,
  DifficultyLevel,
  QuestionCategory,
  QuestionType,
  Subject,
} from "@/types/questions";

export interface QuestionFilterValues {
  search: string;
  subjectId: string;
  chapterId: string;
  categoryId: string;
  difficulty: string;
  questionType: string;
}

interface QuestionFiltersProps {
  values: QuestionFilterValues;
  subjects: Subject[];
  chapters: Chapter[];
  categories: QuestionCategory[];
  onChange: (values: QuestionFilterValues) => void;
  onReset: () => void;
}

export function QuestionFilters({
  values,
  subjects,
  chapters,
  categories,
  onChange,
  onReset,
}: QuestionFiltersProps) {
  function update(patch: Partial<QuestionFilterValues>) {
    onChange({ ...values, ...patch });
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={values.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search questions or tags..."
            className="pl-9"
          />
        </div>

        <Select
          value={values.subjectId}
          onChange={(e) =>
            update({ subjectId: e.target.value, chapterId: "" })
          }
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select
          value={values.chapterId}
          onChange={(e) => update({ chapterId: e.target.value })}
          disabled={!values.subjectId}
        >
          <option value="">All chapters</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          value={values.categoryId}
          onChange={(e) => update({ categoryId: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          value={values.difficulty}
          onChange={(e) => update({ difficulty: e.target.value })}
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>

        <Select
          value={values.questionType}
          onChange={(e) => update({ questionType: e.target.value })}
        >
          <option value="">All types</option>
          <option value="mcq">MCQ</option>
          <option value="integer">Integer</option>
        </Select>
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}

export const emptyFilters: QuestionFilterValues = {
  search: "",
  subjectId: "",
  chapterId: "",
  categoryId: "",
  difficulty: "",
  questionType: "",
};
