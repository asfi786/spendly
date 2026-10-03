/** Polished skeleton loaders — no spinners. */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-5 ${className}`} aria-hidden>
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-3 h-8 w-36" />
      <div className="skeleton mt-2 h-3 w-28" />
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-5 ${className}`} aria-hidden>
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-7 w-48" />
      </div>
      <div className="skeleton mt-5 h-56 w-full" />
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card divide-y divider overflow-hidden" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="skeleton h-11 w-11 !rounded-xl" />
          <div className="flex-1">
            <div className="skeleton h-3.5 w-40" />
            <div className="skeleton mt-2 h-3 w-24" />
          </div>
          <div className="skeleton h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading content" role="status">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonChart />
      <SkeletonRows rows={4} />
    </div>
  );
}
