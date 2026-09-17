export default function ProgressBar({ value, max = 100, tone = 'primary', showLabel = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const tones = {
    primary: 'from-primary-500 to-primary-600',
    amber: 'from-amber-400 to-amber-500',
    red: 'from-red-500 to-red-600',
    green: 'from-rivet-400 to-rivet-500',
    violet: 'from-violet-400 to-violet-500',
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gunmetal-700">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${tones[tone] || tones.primary}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
