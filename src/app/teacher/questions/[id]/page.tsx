import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { getQuestionById } from "@/lib/db/questions";
import { QuestionView } from "@/components/questions/question-view";

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

      <QuestionView question={question} />
    </div>
  );
}
