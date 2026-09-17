const STYLES = {
  TODO: 'bg-slate-100 dark:bg-gunmetal-700 text-slate-600 dark:text-slate-400',
  IN_PROGRESS: 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 ring-1 ring-sky-400/25',
  REVIEW: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-1 ring-violet-400/25',
  COMPLETED: 'bg-rivet-400/15 dark:bg-rivet-400/10 text-rivet-600 dark:text-rivet-400 ring-1 ring-rivet-400/25',
  BLOCKED: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 ring-1 ring-red-400/25',
};

const LABELS = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  REVIEW: 'In review',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked',
};

export default function TaskStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
        STYLES[status] || 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400'
      }`}
    >
      {LABELS[status] || status?.replace(/_/g, ' ')}
    </span>
  );
}
