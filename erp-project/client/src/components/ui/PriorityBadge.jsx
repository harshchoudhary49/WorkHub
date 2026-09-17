const STYLES = {
  low: 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400',
  medium: 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 ring-1 ring-sky-300/30',
  high: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-400/30',
  urgent: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 ring-1 ring-red-400/30',
};

const ICONS = {
  low: '↓',
  medium: '→',
  high: '↑',
  urgent: '⚡',
};

export default function PriorityBadge({ priority }) {
  const cls = STYLES[priority] || 'bg-slate-100 dark:bg-gunmetal-700 text-slate-500 dark:text-slate-400';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>
      <span className="text-[10px] leading-none">{ICONS[priority]}</span>
      {priority}
    </span>
  );
}
