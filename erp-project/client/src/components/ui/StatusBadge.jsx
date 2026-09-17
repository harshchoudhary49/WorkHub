const STYLES = {
  present: 'bg-rivet-400/15 dark:bg-rivet-400/10 text-rivet-600 dark:text-rivet-400 ring-1 ring-rivet-400/25',
  remote: 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 ring-1 ring-sky-400/25',
  'half-day': 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-400/25',
  absent: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 ring-1 ring-red-400/25',
  leave: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-1 ring-violet-400/25',
  holiday: 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400',
  weekend: 'bg-slate-100 dark:bg-gunmetal-700 text-slate-400 dark:text-slate-500',
  'not-checked-in': 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400',
  pending: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-400/25',
  approved: 'bg-rivet-400/15 dark:bg-rivet-400/10 text-rivet-600 dark:text-rivet-400 ring-1 ring-rivet-400/25',
  rejected: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 ring-1 ring-red-400/25',
  cancelled: 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400',
};

const DOTS = {
  present: 'bg-rivet-500',
  remote: 'bg-sky-500',
  approved: 'bg-rivet-500',
  pending: 'bg-amber-500',
  rejected: 'bg-red-500',
  absent: 'bg-red-500',
  leave: 'bg-violet-500',
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400';
  const dot = DOTS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {status?.replace(/-/g, ' ')}
    </span>
  );
}
