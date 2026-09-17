export default function Banner({ tone = 'error', children }) {
  const tones = {
    error: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400',
    success: 'bg-rivet-400/10 dark:bg-rivet-600/15 border border-rivet-400/30 dark:border-rivet-600/30 text-rivet-600 dark:text-rivet-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400',
    info: 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 text-primary-700 dark:text-primary-400',
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${tones[tone] || tones.error}`}>
      {tone === 'error' && (
        <svg className="h-4 w-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
      )}
      {tone === 'success' && (
        <svg className="h-4 w-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      )}
      <span>{children}</span>
    </div>
  );
}
