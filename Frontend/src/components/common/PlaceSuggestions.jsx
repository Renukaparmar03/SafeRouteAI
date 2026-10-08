import React, { useEffect, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { mapService } from '../../services/mapService';
import { Spinner } from './StateViews';

/**
 * Debounced Mapbox place search. Returns { results, loading, error }.
 * Searching starts after 3 characters and stops once a place is picked.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const usePlaceSearch = (query, { enabled = true, near } = {}) => {
  const [state, setState] = useState({ results: [], loading: false, error: null });
  const nearLat = near?.latitude;
  const nearLng = near?.longitude;

  useEffect(() => {
    const q = query?.trim() || '';
    if (!enabled || q.length < 3) {
      setState({ results: [], loading: false, error: null });
      return undefined;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    const timer = setTimeout(async () => {
      try {
        const results = await mapService.search(q, Number.isFinite(nearLat) ? { latitude: nearLat, longitude: nearLng } : undefined);
        if (!cancelled) setState({ results, loading: false, error: null });
      } catch (error) {
        if (!cancelled) setState({ results: [], loading: false, error });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled, nearLat, nearLng]);

  return state;
};

/** Dropdown list rendered under an existing search input. */
const PlaceSuggestions = ({ open, results, loading, error, onSelect, onUseCurrentLocation, className }) => {
  if (!open) return null;
  const hasContent = loading || error || results.length || onUseCurrentLocation;
  if (!hasContent) return null;

  return (
    <div className={clsx('absolute left-0 right-0 top-full mt-2 bg-surface rounded-2xl shadow-lg border border-border z-40 overflow-hidden', className)}>
      {onUseCurrentLocation && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onUseCurrentLocation}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-background border-b border-border/60"
        >
          <LocateFixed className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[13px] font-semibold text-primary">Use my current location</span>
        </button>
      )}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-3 text-[12px] text-text-secondary">
          <Spinner className="w-4 h-4" /> Searching…
        </div>
      )}
      {error && <p className="px-4 py-3 text-[12px] text-danger font-medium">{error.message}</p>}
      {!loading &&
        results.map((place) => (
          <button
            key={place.id || `${place.latitude},${place.longitude}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(place)}
            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-background border-b border-border/40 last:border-b-0"
          >
            <MapPin className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-text-primary truncate">{place.name}</span>
              <span className="block text-[11px] text-text-secondary truncate">{place.fullAddress}</span>
            </span>
          </button>
        ))}
    </div>
  );
};

export default PlaceSuggestions;
