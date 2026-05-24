import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ——— Primitives ——— */

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5">
      <Skeleton className="mb-3 h-5 w-5 rounded-md" />
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function StatCardsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroBannerSkeleton({
  className,
  borderAccent = "border-violet-500/20",
}: {
  className?: string;
  borderAccent?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-zinc-900/80 p-8",
        borderAccent,
        className,
      )}
    >
      <Skeleton className="mb-3 h-4 w-28" />
      <Skeleton className="mb-2 h-9 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-11 w-36 rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/* ——— Teacher dashboard ——— */

export function BatchCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-4 h-6 w-16 rounded-full" />
      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-zinc-800/40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-zinc-800/20 p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

export function BatchOverviewPanelSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <BatchCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="mx-auto h-4 w-40" />
    </section>
  );
}

export function StudentCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton circle className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex justify-between pt-3 border-t border-zinc-800/40">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-12 rounded-md" />
      </div>
    </div>
  );
}

export function StudentAnalyticsPanelSkeleton() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StudentCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="mx-auto h-4 w-32" />
    </section>
  );
}

export function QuestionInsightCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div className="flex justify-between gap-3 mb-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-14 rounded-md shrink-0" />
      </div>
      <div className="space-y-2 mb-4 pb-4 border-b border-zinc-800/40">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-6 w-12 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function QuestionInsightsPanelSkeleton() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <QuestionInsightCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="mx-auto h-4 w-40" />
    </section>
  );
}

export function NotificationItemSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-4 space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-40" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function NotificationsPanelSkeleton() {
  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
      <Skeleton className="h-6 w-44" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <NotificationItemSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function TeacherDashboardPageSkeleton() {
  return (
    <div className="space-y-10">
      <HeroBannerSkeleton borderAccent="border-violet-500/20" />
      <StatCardsGridSkeleton />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <StudentAnalyticsPanelSkeleton />
      <QuestionInsightsPanelSkeleton />
      <BatchOverviewPanelSkeleton />
      <NotificationsPanelSkeleton />
      <section className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ——— Student dashboard ——— */

export function PendingActionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
      <Skeleton className="mb-2 h-5 w-5" />
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="h-7 w-12" />
    </div>
  );
}

export function SubjectCardSkeleton() {
  return (
    <div className="rounded-2xl border border-violet-500/25 bg-zinc-900/50 p-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton circle className="h-14 w-14" />
      </div>
      <Skeleton className="mt-4 h-6 w-28" />
      <Skeleton className="mt-2 h-4 w-40" />
    </div>
  );
}

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-10">
      <HeroBannerSkeleton borderAccent="border-cyan-500/20" />
      <section>
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <PendingActionCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <StatCardsGridSkeleton count={3} />
      <section>
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SubjectCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </section>
    </div>
  );
}

/* ——— Explorer ——— */

export function ExplorerTreeSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, si) => (
        <div
          key={si}
          className="rounded-2xl border border-zinc-800/60 bg-zinc-950/50 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <Skeleton className="h-5 w-5 shrink-0" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="ml-auto h-6 w-8 rounded-full" />
          </div>
          <div className="border-t border-zinc-800/60 p-3 space-y-2">
            {Array.from({ length: 2 }).map((_, ci) => (
              <div key={ci} className="rounded-xl border border-zinc-800/60 p-3 space-y-2">
                <Skeleton className="h-4 w-40" />
                {Array.from({ length: 4 }).map((_, li) => (
                  <Skeleton key={li} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExplorerQuestionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 space-y-2"
        >
          <div className="flex justify-between">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function ExplorerPageSkeleton() {
  return (
    <div className="space-y-8">
      <HeroBannerSkeleton borderAccent="border-cyan-500/20" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ExplorerTreeSkeleton />
        <div>
          <Skeleton className="mb-4 h-5 w-40" />
          <ExplorerQuestionListSkeleton />
        </div>
      </div>
    </div>
  );
}

/* ——— Lists & cards ——— */

export function QuestionQueueItemSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg shrink-0" />
      </div>
    </div>
  );
}

export function QuestionQueueListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <QuestionQueueItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChapterCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div className="flex justify-between gap-3">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton circle className="h-12 w-12" />
      </div>
      <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
      <Skeleton className="mt-2 h-3 w-40" />
    </div>
  );
}

export function ChapterGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ChapterCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryBucketSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div className="flex justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton circle className="h-11 w-11" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

export function ChapterAnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-5 w-32 rounded-full" />
      </div>
      <section className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategoryBucketSkeleton key={i} />
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CategoryBucketSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function QuestionBankCardSkeleton() {
  return (
    <article className="rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-5 space-y-3">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-16 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </article>
  );
}

export function QuestionBankListSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <QuestionBankCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PracticeSessionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-12 w-24 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full max-w-2xl rounded-full" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 space-y-6">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-24 w-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
