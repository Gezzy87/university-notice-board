// Shimmer skeletons shown via <Suspense> while server data loads.
// Uses the .quad-shimmer animation defined in globals.css.

function Bar({ className }: { className?: string }) {
  return <div className={`quad-shimmer ${className ?? ""}`} />;
}

function SkeletonCard() {
  return (
    <div className="border-border bg-card rounded-[18px] border p-[17px] shadow-[var(--shadow-card)]">
      <Bar className="h-6 w-24 rounded-full" />
      <Bar className="mt-3 h-5 w-3/4 rounded" />
      <Bar className="mt-2 h-4 w-full rounded" />
      <Bar className="mt-4 h-4 w-1/3 rounded" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:max-w-4xl lg:px-8 lg:py-7">
      <div className="hidden items-center justify-between lg:flex">
        <Bar className="h-8 w-32 rounded-lg" />
        <Bar className="h-9 w-40 rounded-full" />
      </div>
      <Bar className="mt-4 h-12 w-full rounded-xl" />
      <div className="mt-3 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bar key={i} className="h-8 w-20 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 lg:max-w-4xl lg:px-8 lg:py-7">
      <Bar className="h-8 w-40 rounded-lg" />
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 lg:px-8 lg:py-7">
      <div className="flex items-center justify-between">
        <Bar className="h-8 w-32 rounded-lg" />
        <Bar className="h-9 w-40 rounded-full" />
      </div>
      <Bar className="mt-5 h-[420px] w-full rounded-[18px]" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 py-4 lg:py-7">
      <Bar className="size-9 rounded-[11px]" />
      <Bar className="mt-5 h-6 w-28 rounded-full" />
      <Bar className="mt-4 h-9 w-3/4 rounded-lg" />
      <Bar className="mt-5 h-11 w-52 rounded-lg" />
      <div className="mt-6 space-y-3">
        <Bar className="h-4 w-full rounded" />
        <Bar className="h-4 w-full rounded" />
        <Bar className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}
