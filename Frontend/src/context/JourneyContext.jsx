import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { tripService } from '../services/tripService';
import { trackingService } from '../services/trackingService';
import { getCurrentPosition, watchPosition } from '../hooks/useGeolocation';
import { distanceBetween } from '../utils/format';

const JourneyContext = createContext(null);

// Client-side throttling: send at most every 5 s when moving ≥10 m, plus a heartbeat every 30 s.
const MIN_SEND_INTERVAL_MS = 5000;
const MIN_MOVE_METERS = 10;
const HEARTBEAT_MS = 30000;

/**
 * Owns live tracking. Location is only watched while a trip is ACTIVE,
 * i.e. after the user explicitly presses Start Journey, and stops on End Journey.
 */
export const JourneyProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [state, setState] = useState('idle'); // idle | starting | tracking | ending
  const [position, setPosition] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [error, setError] = useState(null);
  const [checked, setChecked] = useState(false);

  const stopWatchRef = useRef(null);
  const lastSentRef = useRef({ at: 0, position: null });
  const tripRef = useRef(null);

  const stopWatching = useCallback(() => {
    stopWatchRef.current?.();
    stopWatchRef.current = null;
  }, []);

  const send = useCallback(async (pos, force = false) => {
    const activeTrip = tripRef.current;
    if (!activeTrip) return;
    const last = lastSentRef.current;
    const now = Date.now();
    const moved = last.position ? distanceBetween(last.position, pos) : Infinity;
    const due = force || now - last.at >= HEARTBEAT_MS || (now - last.at >= MIN_SEND_INTERVAL_MS && moved >= MIN_MOVE_METERS);
    if (!due) return;
    lastSentRef.current = { at: now, position: pos };
    try {
      const result = await trackingService.sendLocation({
        tripId: activeTrip.id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy ?? undefined,
        speed: Number.isFinite(pos.speed) ? Math.max(0, pos.speed) : undefined,
        heading: Number.isFinite(pos.heading) ? pos.heading : undefined,
        timestamp: new Date(pos.timestamp || now).toISOString(),
      });
      if (result && !result.throttled) setLiveStatus(result);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  const beginWatching = useCallback(() => {
    stopWatching();
    lastSentRef.current = { at: 0, position: null };
    stopWatchRef.current = watchPosition(
      (pos) => {
        setPosition(pos);
        send(pos);
      },
      (err) => setError(err)
    );
  }, [send, stopWatching]);

  const loadTrip = useCallback(async (id) => {
    const details = await tripService.get(id);
    tripRef.current = details.trip;
    setTrip(details.trip);
    return details.trip;
  }, []);

  // Resume an already-active journey after a reload; never start tracking otherwise.
  useEffect(() => {
    if (!isAuthenticated) {
      stopWatching();
      tripRef.current = null;
      setTrip(null);
      setLiveStatus(null);
      setPosition(null);
      setState('idle');
      setChecked(true);
      return;
    }
    let cancelled = false;
    setChecked(false);
    tripService
      .list('active')
      .then(async (trips) => {
        if (cancelled || !trips.length) return;
        await loadTrip(trips[0].id);
        if (cancelled) return;
        setState('tracking');
        beginWatching();
      })
      .catch(() => {})
      .finally(() => !cancelled && setChecked(true));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, loadTrip, beginWatching, stopWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  const startJourney = useCallback(
    async (tripId) => {
      setError(null);
      setState('starting');
      try {
        // Ask for location first so a trip is never marked active without tracking permission.
        const pos = await getCurrentPosition();
        await tripService.start(tripId);
        await loadTrip(tripId);
        setPosition(pos);
        setState('tracking');
        beginWatching();
        send(pos, true);
        return tripRef.current;
      } catch (err) {
        setState(tripRef.current ? 'tracking' : 'idle');
        setError(err);
        throw err;
      }
    },
    [beginWatching, loadTrip, send]
  );

  const endJourney = useCallback(async () => {
    const activeTrip = tripRef.current;
    if (!activeTrip) return null;
    setState('ending');
    stopWatching();
    try {
      const ended = await tripService.end(activeTrip.id);
      tripRef.current = null;
      setTrip(null);
      setLiveStatus(null);
      setPosition(null);
      setState('idle');
      return ended;
    } catch (err) {
      setError(err);
      setState('tracking');
      beginWatching();
      throw err;
    }
  }, [beginWatching, stopWatching]);

  const value = useMemo(
    () => ({
      trip,
      isActive: Boolean(trip) && (state === 'tracking' || state === 'ending'),
      state,
      position,
      liveStatus,
      error,
      checked,
      startJourney,
      endJourney,
    }),
    [trip, state, position, liveStatus, error, checked, startJourney, endJourney]
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useJourney = () => {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used inside JourneyProvider');
  return ctx;
};
