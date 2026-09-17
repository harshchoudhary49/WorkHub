const STYLES = {
  present: 'bg-emerald-50 text-emerald-700',
  remote: 'bg-sky-50 text-sky-700',
  'half-day': 'bg-amber-50 text-amber-700',
  absent: 'bg-red-50 text-red-600',
  leave: 'bg-violet-50 text-violet-700',
  holiday: 'bg-slate-100 text-slate-500',
  weekend: 'bg-slate-100 text-slate-400',
  'not-checked-in': 'bg-slate-100 text-slate-500',
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-500';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${cls}`}>
      {status?.replace('-', ' ')}
    </span>
  );
}
