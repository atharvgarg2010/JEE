import type { QuestionListItem } from "@/types/dashboard";

export function buildPracticeHref(q: {
  id: string;
  subject_id: string;
  chapter_id: string;
  category_id: string;
  difficulty?: string | null;
}) {
  const params = new URLSearchParams({
    questionId: q.id,
    subjectId: q.subject_id,
    chapterId: q.chapter_id,
    categoryId: q.category_id,
  });
  if (q.difficulty) params.set("difficulty", q.difficulty);
  return `/student/practice?${params.toString()}`;
}

export function buildBucketPracticeHref(
  subjectId: string,
  chapterId: string,
  categoryId: string,
  difficulty?: string | null,
) {
  const params = new URLSearchParams({
    subjectId,
    chapterId,
    categoryId,
  });
  if (difficulty) params.set("difficulty", difficulty);
  return `/student/practice?${params.toString()}`;
}

export type { QuestionListItem };
