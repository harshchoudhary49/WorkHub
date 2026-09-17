const STYLES = {
  'not-started': 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400',
  'in-progress': 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 ring-1 ring-sky-400/25',
  completed: 'bg-rivet-400/15 dark:bg-rivet-400/10 text-rivet-600 dark:text-rivet-400 ring-1 ring-rivet-400/25',
  cancelled: 'bg-slate-100 dark:bg-gunmetal-700 text-slate-400 dark:text-slate-500',
};

const ICONS = {
  'not-started': '○',
  'in-progress': '◑',
  completed: '●',
  cancelled: '✕',
};

export default function GoalStatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      <span className="text-[10px] leading-none">{ICONS[status]}</span>
      {status?.replace(/-/g, ' ')}
    </span>
  );
}
