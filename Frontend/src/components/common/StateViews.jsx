import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

export const Spinner = ({ className }) => (
  <span className={clsx('inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin', className)} />
);

export const LoadingState = ({ label = 'Loading…', className }) => (
  <div className={clsx('flex flex-col items-center justify-center py-10 gap-3 text-text-secondary', className)}>
    <Spinner className="w-7 h-7" />
    <p className="text-[12px] font-medium">{label}</p>
  </div>
);

export const ErrorState = ({ message = 'Something went wrong. Please try again.', onRetry, className }) => (
  <div className={clsx('flex flex-col items-center justify-center py-8 px-4 gap-3 text-center', className)}>
    <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
      <AlertTriangle className="w-6 h-6 text-danger" />
    </div>
    <p className="text-[13px] font-medium text-text-secondary max-w-[260px]">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[12px] font-bold active:scale-95 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Try again
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon: Icon = AlertTriangle, title, message, action, className }) => (
  <div className={clsx('flex flex-col items-center justify-center py-10 px-4 text-center', className)}>
    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 border border-primary/10">
      <Icon className="w-8 h-8 text-primary/40" />
    </div>
    {title && <h3 className="text-[15px] font-bold text-text-primary mb-1.5">{title}</h3>}
    {message && <p className="text-[12px] text-text-secondary font-medium max-w-[240px]">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/** Inline banner for non-blocking warnings (e.g. a service that is not configured). */
export const InlineNotice = ({ children, tone = 'warning', className }) => (
  <div
    className={clsx(
      'rounded-xl p-3 text-[12px] font-medium border',
      tone === 'danger' && 'bg-danger/5 border-danger/20 text-danger',
      tone === 'warning' && 'bg-warning/5 border-warning/20 text-text-secondary',
      tone === 'info' && 'bg-primary/5 border-primary/20 text-text-secondary',
      className
    )}
  >
    {children}
  </div>
);
