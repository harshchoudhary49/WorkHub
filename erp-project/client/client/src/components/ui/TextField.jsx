export default function TextField({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
