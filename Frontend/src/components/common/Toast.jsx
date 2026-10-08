import React from 'react';
import { AlertTriangle, Bell, CloudRain, Navigation, ShieldAlert, X } from 'lucide-react';
import { clsx } from 'clsx';

const ICONS = { RISK_ALERT: AlertTriangle, WEATHER_ALERT: CloudRain, TRIP_UPDATE: Navigation, SOS: ShieldAlert, ADMIN_ALERT: Bell, SYSTEM: Bell };

const tone = (severity) =>
  severity === 'HIGH' || severity === 'CRITICAL'
    ? { bar: 'bg-danger', icon: 'text-danger bg-danger/10' }
    : severity === 'MEDIUM'
      ? { bar: 'bg-warning', icon: 'text-warning bg-warning/10' }
      : { bar: 'bg-primary', icon: 'text-primary bg-primary/10' };

/** Real-time in-app notification banners (top of the screen). */
const Toast = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Bell;
        const c = tone(t.severity);
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto relative overflow-hidden bg-surface rounded-2xl shadow-lg border border-border p-3 pl-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2"
          >
            <div className={clsx('absolute left-0 top-0 bottom-0 w-1', c.bar)} />
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', c.icon)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-text-primary truncate">{t.title}</p>
              <p className="text-[12px] text-text-secondary leading-snug line-clamp-2">{t.message}</p>
            </div>
            <button onClick={() => onDismiss(t.id)} className="p-1 text-text-secondary hover:text-text-primary" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
