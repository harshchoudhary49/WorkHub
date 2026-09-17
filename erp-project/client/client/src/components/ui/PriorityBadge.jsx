const STYLES = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-sky-50 text-sky-700',
  high: 'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-600',
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STYLES[priority] || ''}`}>
      {priority}
    </span>
  );
}
