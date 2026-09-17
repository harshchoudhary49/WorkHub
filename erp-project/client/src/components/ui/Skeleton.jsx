/**
 * Skeleton — animated shimmer placeholder for loading states.
 *
 * Usage:
 *   <Skeleton className="h-6 w-40" />           // single bar
 *   <Skeleton.Card lines={3} />                  // card with multiple lines
 *   <Skeleton.Table rows={5} cols={4} />         // table rows
 */
export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

Skeleton.Card = function SkeletonCard({ lines = 2, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 dark:border-gunmetal-700 dark:bg-gunmetal-800 ${className}`}
      aria-busy="true"
    >
      <Skeleton className="mb-4 h-3 w-24" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`mb-2 h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
};

Skeleton.Table = function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-gunmetal-700 dark:bg-gunmetal-800">
      {/* Header */}
      <div className="flex gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-gunmetal-700 dark:bg-gunmetal-900">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 border-b border-slate-50 px-4 py-3 dark:border-gunmetal-700"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'w-32' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
};

Skeleton.StatGrid = function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-gunmetal-700 dark:bg-gunmetal-800"
        >
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
};
