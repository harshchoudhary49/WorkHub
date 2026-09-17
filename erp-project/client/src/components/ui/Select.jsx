export default function Select({ label, options, placeholder, ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      <select
        className="w-full rounded-[10px] border border-slate-200 dark:border-gunmetal-600 bg-white dark:bg-gunmetal-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-all duration-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 hover:border-slate-300 dark:hover:border-gunmetal-500 appearance-none cursor-pointer"
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
