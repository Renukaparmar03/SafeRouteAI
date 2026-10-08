import React, { useEffect, useState } from 'react';
import { Filter, AlertTriangle, CloudRain, Trash2, CheckCircle, Navigation, ShieldAlert, Bell, CheckCheck } from 'lucide-react';
import { LABELS } from '../../../constants/labels';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { useNotifications } from '../../../context/NotificationContext';
import { timeAgo } from '../../../utils/format';
import { clsx } from 'clsx';

const getAlertIcon = (alert) => {
  switch (alert.type) {
    case 'RISK_ALERT':
      return alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
        ? { icon: AlertTriangle, bg: 'bg-danger/10', color: 'text-danger' }
        : { icon: AlertTriangle, bg: 'bg-warning/10', color: 'text-warning' };
    case 'WEATHER_ALERT':
      return { icon: CloudRain, bg: 'bg-primary/10', color: 'text-primary' };
    case 'TRIP_UPDATE':
      return { icon: Navigation, bg: 'bg-success/10', color: 'text-success' };
    case 'SOS':
      return { icon: ShieldAlert, bg: 'bg-danger/10', color: 'text-danger' };
    case 'ADMIN_ALERT':
      return { icon: Bell, bg: 'bg-warning/10', color: 'text-warning' };
    default:
      return { icon: Bell, bg: 'bg-surface', color: 'text-text-secondary' };
  }
};

const AlertsScreen = () => {
  const L = LABELS.ALERTS;
  const [activeTab, setActiveTab] = useState(L.TABS.ACTIVE);
  const [actionError, setActionError] = useState('');
  const { notifications, unreadCount, status, error, refresh, markRead, markAllRead, remove } = useNotifications();

  // Always show the latest list when the screen opens.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const tabs = [L.TABS.ALL, L.TABS.ACTIVE, L.TABS.PAST];

  const filteredAlerts = notifications.filter(alert => {
    if (activeTab === L.TABS.ACTIVE) return !alert.read;
    if (activeTab === L.TABS.PAST) return alert.read;
    return true; // ALL
  });

  const run = async (fn) => {
    setActionError('');
    try {
      await fn();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-white sticky top-0 z-10 shrink-0">
        <div className="w-8"></div> {/* Spacer */}
        <h1 className="text-[18px] font-bold text-text-primary">
          {L.TITLE}
        </h1>
        <button
          onClick={() => run(markAllRead)}
          disabled={!unreadCount}
          title="Mark all as read"
          className="p-2 -mr-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95 disabled:opacity-40"
        >
          {unreadCount ? <CheckCheck className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white px-5 border-b border-border/40 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "flex-1 py-3 text-[14px] font-bold transition-all relative",
              activeTab === tab ? "text-primary" : "text-text-secondary"
            )}
          >
            {tab}
            {tab === L.TABS.ACTIVE && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] align-middle">
                {unreadCount}
              </span>
            )}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-28">
        {actionError && <p className="mb-3 text-[12px] font-medium text-danger">{actionError}</p>}

        {status === 'loading' && !notifications.length ? (
          <LoadingState label="Loading alerts…" />
        ) : status === 'error' && !notifications.length ? (
          <ErrorState message={error?.message} onRetry={refresh} />
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-70">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p className="text-[14px] font-medium">{L.EMPTY_STATE}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAlerts.map((alert) => {
              const { icon: Icon, bg, color } = getAlertIcon(alert);
              const unread = !alert.read;

              return (
                <div
                  key={alert.id}
                  onClick={() => unread && run(() => markRead(alert.id))}
                  className={clsx(
                    "flex flex-col bg-white rounded-[16px] p-4 border transition-all relative overflow-hidden group",
                    unread ? "border-primary/20 shadow-sm cursor-pointer" : "border-border/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  )}
                >
                  {/* Unread Indicator Bar */}
                  {unread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-[16px]"></div>
                  )}

                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-[14px] ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={clsx(
                        "text-[14px] font-bold truncate pr-16",
                        unread ? "text-text-primary" : "text-text-secondary"
                      )}>
                        {alert.title}
                      </h3>
                      <p className="text-[12px] text-text-secondary mt-1 leading-relaxed line-clamp-2">
                        {alert.message}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="absolute top-4 right-4 text-[10px] font-medium text-text-secondary">
                      {timeAgo(alert.createdAt)}
                    </span>
                  </div>

                  {/* Actions (Visible on hover/active or always on mobile via design) */}
                  <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    {unread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          run(() => markRead(alert.id));
                        }}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-primary active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {L.ACTIONS.MARK_READ}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        run(() => remove(alert.id));
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-danger active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {L.ACTIONS.DELETE}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNavBar />
    </div>
  );
};

export default AlertsScreen;
