export default function Button({ children, loading, variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary-700 text-white hover:bg-primary-800',
    ghost: 'bg-transparent text-primary-700 hover:bg-primary-50',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? 'Please wait...' : children}
    </button>
  );
}
