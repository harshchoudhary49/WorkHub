export default function Banner({ tone = 'error', children }) {
  const tones = {
    error: 'bg-red-50 text-red-600',
    success: 'bg-emerald-50 text-emerald-700',
  };
  return <p className={`rounded-lg px-3.5 py-2.5 text-sm ${tones[tone]}`}>{children}</p>;
}
