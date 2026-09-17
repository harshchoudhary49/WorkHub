export default function TextField({ label, error, hint, icon, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </span>
        )}
        <input
          className={`w-full rounded-[10px] border bg-white dark:bg-gunmetal-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-400 dark:border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
              : 'border-slate-200 dark:border-gunmetal-600 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 hover:border-slate-300 dark:hover:border-gunmetal-500'
          }`}
          {...props}
        />
      </div>
      {hint && !error && (
        <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>
      )}
      {error && (
        <span className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </span>
      )}
    </label>
  );
}
