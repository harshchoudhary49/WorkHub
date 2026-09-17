const STYLES = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-sky-50 text-sky-700',
  REVIEW: 'bg-violet-50 text-violet-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-red-600',
};

export default function TaskStatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] || 'bg-slate-100 text-slate-500'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}
