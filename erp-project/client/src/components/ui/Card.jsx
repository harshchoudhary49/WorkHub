import { Link } from 'react-router-dom';

const ACCENT_CLASSES = {
  blue: 'from-primary-500 to-primary-600',
  green: 'from-rivet-400 to-rivet-500',
  amber: 'from-amber-400 to-amber-500',
  red: 'from-red-400 to-red-500',
  violet: 'from-violet-400 to-violet-500',
  none: 'from-transparent to-transparent',
};

const STAT_CARD_CLASSES = {
  blue: 'stat-card-blue',
  green: 'stat-card-green',
  amber: 'stat-card-amber',
  red: 'stat-card-red',
};

export default function Card({
  title,
  subtitle,
  eyebrow,
  accent = 'blue',
  to,
  stat,
  className = '',
  bodyClassName = '',
  children,
}) {
  const statClass = STAT_CARD_CLASSES[accent] || '';
  const base = `relative overflow-hidden rounded-[14px] border bg-white dark:bg-gunmetal-800 shadow-card transition-all duration-200 ${
    stat ? statClass : ''
  }`;
  const interactive = to
    ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5'
    : '';
  const Wrapper = to ? Link : 'div';
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper {...wrapperProps} className={`${base} ${interactive} ${className}`}>
      {/* Gradient accent bar */}
      {accent !== 'none' && (
        <div
          className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${
            ACCENT_CLASSES[accent] || ACCENT_CLASSES.blue
          }`}
        />
      )}

      <div className={`p-5 pt-6 ${bodyClassName}`}>
        {(title || eyebrow) && (
          <div className="mb-4">
            {eyebrow && (
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {eyebrow}
              </p>
            )}
            {title && (
              <p className="text-base font-semibold leading-tight text-slate-800 dark:text-slate-100">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </Wrapper>
  );
}
