import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateQuestionForm } from "@/components/questions/create-question-form";

export const metadata = {
  title: "Create Question | JEE Tracker",
};

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teacher/questions"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-violet-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to question bank
        </Link>
        <h1 className="text-3xl font-bold text-white">Create question</h1>
        <p className="mt-2 text-zinc-400">
          Add MCQ or integer-type questions with solutions and tags.
        </p>
      </div>
      <CreateQuestionForm />
    </div>
  );
}
