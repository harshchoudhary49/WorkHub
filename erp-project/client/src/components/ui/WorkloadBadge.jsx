const STYLES = {
  low: 'bg-sky-50 text-sky-700',
  balanced: 'bg-emerald-50 text-emerald-700',
  high: 'bg-amber-50 text-amber-700',
};

export default function WorkloadBadge({ workload }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STYLES[workload] || ''}`}>
      {workload} workload
    </span>
  );
}
