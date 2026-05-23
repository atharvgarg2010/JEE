import { redirect } from "next/navigation";
import { QuestionExplorerClient } from "@/components/practice/question-explorer-client";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = {
  title: "Question Explorer | JEE Tracker",
};

export const dynamic = "force-dynamic";

export default async function StudentExplorerPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    redirect("/login/student");
  }

  return <QuestionExplorerClient />;
}
