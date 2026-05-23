import { Suspense } from "react";
import { PracticeSessionClient } from "@/components/practice/practice-session-client";

export const metadata = {
  title: "Practice | JEE Tracker",
};

export default function StudentPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-zinc-500">Loading practice...</div>
      }
    >
      <PracticeSessionClient />
    </Suspense>
  );
}
