export default function Button({
  children,
  loading,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const sizes = {
    sm: 'rounded-lg px-3 py-1.5 text-xs',
    md: 'rounded-[10px] px-4 py-2.5 text-sm',
    lg: 'rounded-xl px-6 py-3 text-base',
  };

  const variants = {
    primary:
      'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-sm shadow-primary-500/25 hover:from-primary-700 hover:to-primary-600 hover:shadow-primary-500/35 hover:-translate-y-[1px] active:translate-y-0 focus-visible:ring-primary-400',
    secondary:
      'bg-white dark:bg-gunmetal-700 border border-slate-200 dark:border-gunmetal-600 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-gunmetal-600 hover:border-slate-300 dark:hover:border-gunmetal-500 hover:-translate-y-[1px] active:translate-y-0 focus-visible:ring-slate-300',
    ghost:
      'bg-transparent text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus-visible:ring-primary-400',
    danger:
      'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-sm shadow-red-500/25 hover:from-red-700 hover:to-red-600 hover:-translate-y-[1px] active:translate-y-0 focus-visible:ring-red-400',
    outline:
      'border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus-visible:ring-primary-400',
  };

  return (
    <button
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          <span>Please wait…</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
