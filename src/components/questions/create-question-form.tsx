"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormSection } from "@/components/questions/form-section";
import { FormFieldGroup } from "@/components/questions/form-field-group";
import {
  OptionsEditor,
  defaultMcqOptions,
} from "@/components/questions/options-editor";
import { TagsInput } from "@/components/questions/tags-input";
import { SubmitButton } from "@/components/auth/submit-button";
import type {
  Chapter,
  DifficultyLevel,
  McqOption,
  QuestionCategory,
  QuestionType,
  Subject,
} from "@/types/questions";

const CREATED_BY_TEACHER_SLUG = "created-by-teacher";

export function CreateQuestionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);

  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<McqOption[]>(defaultMcqOptions);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [solution, setSolution] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const requiresDifficulty =
    selectedCategory?.slug === CREATED_BY_TEACHER_SLUG;

  const loadChapters = useCallback(async (sid: string) => {
    const res = await fetch(`/api/teacher/metadata?subjectId=${sid}`);
    const data = await res.json();
    if (data.success) setChapters(data.chapters);
  }, []);

  useEffect(() => {
    fetch("/api/teacher/metadata")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSubjects(data.subjects);
          setCategories(data.categories);
          setChapters(data.chapters);
        }
      })
      .finally(() => setMetaLoading(false));
  }, []);

  useEffect(() => {
    if (subjectId) {
      loadChapters(subjectId);
      setChapterId("");
    }
  }, [subjectId, loadChapters]);

  useEffect(() => {
    if (questionType === "mcq" && options.length && !correctAnswer) {
      setCorrectAnswer(options[0].id);
    }
  }, [questionType, options, correctAnswer]);

  useEffect(() => {
    if (questionType === "integer") {
      setCorrectAnswer("");
    }
  }, [questionType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/teacher/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          chapterId,
          categoryId,
          difficulty: requiresDifficulty ? difficulty : difficulty || null,
          questionType,
          questionText,
          options: questionType === "mcq" ? options : null,
          correctAnswer,
          solution,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error ?? "Failed to create question";
        if (msg.includes(":")) {
          const [field, ...rest] = msg.split(":");
          setFieldErrors({ [field.trim()]: rest.join(":").trim() });
        }
        throw new Error(msg);
      }
      router.push("/teacher/questions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question");
    } finally {
      setLoading(false);
    }
  }

  if (metaLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-zinc-500">
        Loading form...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && !Object.keys(fieldErrors).length && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormSection title="Classification" description="Subject, chapter, and category">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormFieldGroup label="Subject" error={fieldErrors.subjectId}>
            <Select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormFieldGroup>

          <FormFieldGroup label="Chapter" error={fieldErrors.chapterId}>
            <Select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              required
              disabled={!subjectId}
            >
              <option value="">Select chapter</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormFieldGroup>

          <FormFieldGroup label="Category" error={fieldErrors.categoryId}>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormFieldGroup>

          <FormFieldGroup
            label="Difficulty"
            error={fieldErrors.difficulty}
            hint={
              requiresDifficulty
                ? "Required for Created by Teacher (Easy / Medium / Hard)"
                : "Optional for other categories"
            }
          >
            <Select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as DifficultyLevel | "")
              }
              required={requiresDifficulty}
            >
              <option value="">Select difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </FormFieldGroup>
        </div>
      </FormSection>

      <FormSection title="Question" description="Type and content">
        <FormFieldGroup label="Question type">
          <div className="flex gap-3">
            {(["mcq", "integer"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant={questionType === type ? "default" : "secondary"}
                onClick={() => setQuestionType(type)}
              >
                {type === "mcq" ? "MCQ" : "Integer"}
              </Button>
            ))}
          </div>
        </FormFieldGroup>

        <FormFieldGroup label="Question" error={fieldErrors.questionText}>
          <Textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter the question text..."
            className="min-h-[140px] font-mono text-sm"
            required
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Math: inline{" "}
            <code className="rounded bg-zinc-800 px-1 text-violet-300">{"\\( x^2 \\)"}</code>
            {" "}or{" "}
            <code className="rounded bg-zinc-800 px-1 text-violet-300">{"$x^2$"}</code>
            {" · "}
            block{" "}
            <code className="rounded bg-zinc-800 px-1 text-violet-300">{"$$ E=mc^2 $$"}</code>
          </p>
        </FormFieldGroup>

        {questionType === "mcq" ? (
          <FormFieldGroup label="Options" error={fieldErrors.options}>
            <OptionsEditor
              options={options}
              correctAnswer={correctAnswer}
              onChange={setOptions}
              onCorrectChange={setCorrectAnswer}
            />
          </FormFieldGroup>
        ) : (
          <FormFieldGroup
            label="Correct answer (integer)"
            error={fieldErrors.correctAnswer}
          >
            <Input
              type="number"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="e.g. 42"
              required
            />
          </FormFieldGroup>
        )}
      </FormSection>

      <FormSection title="Solution & tags">
        <FormFieldGroup label="Detailed solution" error={fieldErrors.solution}>
          <Textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Step-by-step solution..."
            className="min-h-[160px] font-mono text-sm"
            required
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Use{" "}
            <code className="rounded bg-zinc-800 px-1 text-violet-300">{"$$ \\frac{a}{b} $$"}</code>
            {" "}
            for block equations and{" "}
            <code className="rounded bg-zinc-800 px-1 text-violet-300">{"$x^2$"}</code>
            {" "}for inline.
          </p>
        </FormFieldGroup>

        <FormFieldGroup label="Tags">
          <TagsInput tags={tags} onChange={setTags} />
        </FormFieldGroup>
      </FormSection>

      <div className="flex flex-wrap gap-3">
        <SubmitButton loading={loading}>Publish question</SubmitButton>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/teacher/questions")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
