import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { notificationService } from '../services/notificationService';
import { enablePushNotifications, pushPermission } from '../services/pushService';
import Toast from '../components/common/Toast';
import alertSoundAsset from '../assets/mixkit-signal-alert-771.wav';

const NotificationContext = createContext(null);
const REALTIME_EVENTS = ['journey:notification', 'admin:notification', 'journey:risk-alert'];

export const playAlertSound = () => {
  try {
    const audio = new Audio(alertSoundAsset);
    audio.play().catch((err) => {
      console.warn('[Audio] Signal alert playback error or blocked by browser policy:', err);
    });
  } catch (e) {
    console.error('[Audio] Could not play danger zone alert sound:', e);
  }
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);
  const toastTimers = useRef({});

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(toastTimers.current[id]);
    delete toastTimers.current[id];
  }, []);

  const showToast = useCallback(
    (toast) => {
      const id = toast.id || `${Date.now()}-${Math.random()}`;
      setToasts((list) => [{ ...toast, id }, ...list.filter((t) => t.id !== id)].slice(0, 3));

      // Play alert sound for Danger Zone / Risk Alerts / High Severity / SOS
      const isDangerOrRisk =
        toast.type === 'RISK_ALERT' ||
        toast.type === 'SOS' ||
        toast.severity === 'HIGH' ||
        toast.severity === 'CRITICAL' ||
        (toast.title && /danger|risk|warning|hazard|sos|alert/i.test(toast.title)) ||
        (toast.message && /danger|risk|warning|hazard|sos|alert/i.test(toast.message));

      if (isDangerOrRisk) {
        playAlertSound();
      }

      toastTimers.current[id] = setTimeout(() => dismissToast(id), toast.severity === 'HIGH' || toast.severity === 'CRITICAL' ? 9000 : 5000);
    },
    [dismissToast]
  );

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await notificationService.list();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setStatus('success');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, []);

  // Socket lifecycle follows the session.
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }
    const socket = connectSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNotification = (n) => {
      setNotifications((list) => [n, ...list.filter((x) => x.id !== n.id)]);
      if (!n.read) setUnreadCount((c) => c + 1);
      showToast({ id: n.id, title: n.title, message: n.message, severity: n.severity, type: n.type });
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    REALTIME_EVENTS.forEach((ev) => socket.on(ev, onNotification));
    if (socket.connected) setConnected(true);
    refresh();

    // Register for push silently if the user already granted permission earlier.
    if (pushPermission() === 'granted') enablePushNotifications({ prompt: false }).catch(() => {});

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      REALTIME_EVENTS.forEach((ev) => socket.off(ev, onNotification));
    };
  }, [isAuthenticated, user?.id, refresh, showToast]);

  const markRead = useCallback(async (id) => {
    const updated = await notificationService.markRead(id);
    setNotifications((list) => list.map((n) => (n.id === id ? updated : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const remove = useCallback(
    async (id) => {
      const target = notifications.find((n) => n.id === id);
      await notificationService.remove(id);
      setNotifications((list) => list.filter((n) => n.id !== id));
      if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
    },
    [notifications]
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, status, error, connected, refresh, markRead, markAllRead, remove, showToast, playAlertSound }),
    [notifications, unreadCount, status, error, connected, refresh, markRead, markAllRead, remove, showToast]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};

/** Subscribes a component to a Socket.IO event while mounted. */
// eslint-disable-next-line react-refresh/only-export-components
export const useSocketEvent = (event, handler) => {
  const { connected } = useNotifications();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const listener = (payload) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event, connected]);
};
