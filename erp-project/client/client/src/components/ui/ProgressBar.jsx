export default function ProgressBar({ value, max = 100, tone = 'primary' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const tones = { primary: 'bg-primary-600', amber: 'bg-accent-500', red: 'bg-red-500' };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
