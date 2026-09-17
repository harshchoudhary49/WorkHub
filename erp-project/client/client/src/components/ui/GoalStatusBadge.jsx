const STYLES = {
  'not-started': 'bg-slate-100 text-slate-500',
  'in-progress': 'bg-sky-50 text-sky-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600',
};

export default function GoalStatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STYLES[status] || ''}`}>
      {status?.replace('-', ' ')}
    </span>
  );
}
