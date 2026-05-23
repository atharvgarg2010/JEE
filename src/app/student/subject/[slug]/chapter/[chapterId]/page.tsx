import { ChapterAnalyticsClient } from "@/components/dashboard/chapter-analytics-client";

const NAMES: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
};

export default async function ChapterAnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>;
}) {
  const { slug, chapterId } = await params;
  return (
    <ChapterAnalyticsClient
      subjectSlug={slug}
      subjectName={NAMES[slug] ?? slug}
      chapterId={chapterId}
    />
  );
}
