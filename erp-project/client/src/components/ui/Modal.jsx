import { useEffect, useRef } from 'react';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Modal({ open, onClose, title, subtitle, children, size = 'default' }) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.default} bg-white dark:bg-gunmetal-800 rounded-2xl shadow-modal border border-slate-100 dark:border-gunmetal-700 animate-scale-in overflow-hidden`}
      >
        {/* Gradient top accent */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary-500 to-violet-500" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-gunmetal-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-gunmetal-700" />

        {/* Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
