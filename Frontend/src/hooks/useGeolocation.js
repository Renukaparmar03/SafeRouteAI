import { useCallback, useEffect, useRef, useState } from 'react';

export const LOCATION_MESSAGES = {
  denied: 'Location permission is required. Please allow location access in your browser settings.',
  unavailable: 'Your location is currently unavailable. Check that location services are on.',
  timeout: 'Getting your location took too long. Please try again.',
  unsupported: 'This browser does not support location services.',
};

const toLocationError = (error) => {
  const code = error?.code === 1 ? 'denied' : error?.code === 2 ? 'unavailable' : error?.code === 3 ? 'timeout' : 'unsupported';
  const err = new Error(LOCATION_MESSAGES[code]);
  err.code = code;
  return err;
};

const toPosition = (pos) => ({
  latitude: pos.coords.latitude,
  longitude: pos.coords.longitude,
  accuracy: pos.coords.accuracy,
  speed: pos.coords.speed,
  heading: pos.coords.heading,
  timestamp: pos.timestamp,
});

/** One-shot location request. Prompts for permission only when called. */
export const getCurrentPosition = (options = {}) =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(toLocationError(null));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toPosition(pos)),
      (error) => reject(toLocationError(error)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000, ...options }
    );
  });

/** Continuous watch; returns a stop() function. */
export const watchPosition = (onPosition, onError, options = {}) => {
  if (!('geolocation' in navigator)) {
    onError(toLocationError(null));
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onPosition(toPosition(pos)),
    (error) => onError(toLocationError(error)),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000, ...options }
  );
  return () => navigator.geolocation.clearWatch(id);
};

export const getPermissionState = async () => {
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' });
    return status?.state || 'prompt';
  } catch {
    return 'prompt';
  }
};

/**
 * Current location state for a screen.
 * mode "manual": only fetches when request() is called.
 * mode "if-granted": fetches automatically only if permission was already granted (never prompts on load).
 * mode "auto": fetches on mount (use only on screens that need location to work).
 */
export const useCurrentLocation = (mode = 'manual') => {
  const [state, setState] = useState({ status: 'idle', position: null, error: null });
  const mounted = useRef(true);

  const request = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const position = await getCurrentPosition();
      if (mounted.current) setState({ status: 'success', position, error: null });
      return position;
    } catch (error) {
      if (mounted.current) setState((s) => ({ ...s, status: 'error', error }));
      throw error;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const run = async () => {
      if (mode === 'auto' || (mode === 'if-granted' && (await getPermissionState()) === 'granted')) {
        request().catch(() => {});
      }
    };
    run();
    return () => {
      mounted.current = false;
    };
  }, [mode, request]);

  return { ...state, request };
};
