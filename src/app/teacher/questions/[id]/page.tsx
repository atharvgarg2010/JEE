import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { getQuestionById } from "@/lib/db/questions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return { title: "View Question | JEE Tracker" };
}

export default async function ViewQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return null;

  const { id } = await params;
  const question = await getQuestionById(id, user.id);
  if (!question) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/questions"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-violet-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to question bank
      </Link>

      <div className="flex flex-wrap gap-2">
        <Badge>{question.category_name}</Badge>
        <Badge variant="secondary">{question.subject_name}</Badge>
        <Badge variant="secondary">{question.chapter_name}</Badge>
        <Badge variant="warning">{question.question_type.toUpperCase()}</Badge>
        {question.difficulty && (
          <Badge variant="default">{question.difficulty}</Badge>
        )}
      </div>

      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Question
        </h2>
        <p className="whitespace-pre-wrap text-zinc-100">{question.question_text}</p>
      </section>

      {question.question_type === "mcq" && question.options && (
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Options
          </h2>
          <ul className="space-y-2">
            {question.options.map((opt, i) => (
              <li
                key={opt.id}
                className={`rounded-lg px-4 py-2 text-sm ${
                  opt.id === question.correct_answer
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "bg-zinc-950/50 text-zinc-300"
                }`}
              >
                <span className="font-medium text-zinc-500">
                  {String.fromCharCode(65 + i)}.
                </span>{" "}
                {opt.text}
                {opt.id === question.correct_answer && (
                  <span className="ml-2 text-xs text-emerald-400">(correct)</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {question.question_type === "integer" && (
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Correct answer
          </h2>
          <p className="text-lg font-semibold text-emerald-300">
            {question.correct_answer}
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Solution
        </h2>
        <p className="whitespace-pre-wrap text-zinc-300">{question.solution}</p>
      </section>

      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
