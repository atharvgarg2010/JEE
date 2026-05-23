import { SubjectPageClient } from "@/components/dashboard/subject-page-client";

const NAMES: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `${NAMES[slug] ?? slug} | JEE Tracker` };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <SubjectPageClient slug={slug} subjectName={NAMES[slug] ?? slug} />
  );
}
