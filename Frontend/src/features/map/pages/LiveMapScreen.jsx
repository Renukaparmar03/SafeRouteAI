import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, User, Search, Mic,
  LocateFixed, ShieldAlert, Navigation,
  MapPin, Clock, Route, AlertTriangle, ShieldCheck, Layers, Info, X
} from 'lucide-react';
import { clsx } from 'clsx';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import MapView from '../../../components/map/MapView';
import PlaceSuggestions, { usePlaceSearch } from '../../../components/common/PlaceSuggestions';
import { Spinner } from '../../../components/common/StateViews';
import { ROUTES } from '../../../constants/routes';
import { useCurrentLocation } from '../../../hooks/useGeolocation';
import { useNotifications } from '../../../context/NotificationContext';
import { riskService } from '../../../services/riskService';
import { mapService } from '../../../services/mapService';
import { RISK_LABEL, boundsOf, formatCoords } from '../../../utils/format';

const RISK_TEXT = { LOW: 'text-success', MEDIUM: 'text-warning', HIGH: 'text-danger' };

const LiveMapScreen = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { unreadCount } = useNotifications();
  const location = useCurrentLocation('if-granted');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const suggestions = usePlaceSearch(searchQuery, { enabled: searchFocused, near: location.position });

  const [zones, setZones] = useState(null);
  const [zonesError, setZonesError] = useState(null);
  const [destination, setDestination] = useState(routerLocation.state?.destination || null);
  const [preview, setPreview] = useState({ status: 'idle', data: null, error: null });
  const [showPlaces, setShowPlaces] = useState(false);
  const [places, setPlaces] = useState({ status: 'idle', items: [] });
  const [view, setView] = useState({ fit: null, fitKey: 0, flyTo: null });
  const [notice, setNotice] = useState(null);
  const bboxTimer = useRef(null);
  const mapCenter = useRef(null);

  const focusZone = routerLocation.state?.focusZone;
  const initialCenter = destination || (focusZone?.center && { latitude: focusZone.center.latitude, longitude: focusZone.center.longitude }) || null;

  // Load zones for the visible area (debounced on map move).
  const loadZones = useCallback((bbox) => {
    const [w, s, e, n] = bbox.split(',').map(Number);
    mapCenter.current = { latitude: (s + n) / 2, longitude: (w + e) / 2 };
    clearTimeout(bboxTimer.current);
    bboxTimer.current = setTimeout(async () => {
      try {
        setZones(await riskService.list({ bbox }));
        setZonesError(null);
      } catch (error) {
        setZonesError(error.message);
      }
    }, 300);
  }, []);
  useEffect(() => () => clearTimeout(bboxTimer.current), []);

  // Center on the user once their location is known.
  useEffect(() => {
    if (location.position && !destination && !focusZone) {
      setView((v) => ({ ...v, flyTo: { ...location.position, zoom: 13, key: Date.now() } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.position]);

  useEffect(() => {
    if (focusZone?.center) setView((v) => ({ ...v, flyTo: { ...focusZone.center, zoom: 14, key: Date.now() } }));
  }, [focusZone]);

  // Route preview from the current location to the selected destination.
  useEffect(() => {
    if (!destination) {
      setPreview({ status: 'idle', data: null, error: null });
      return undefined;
    }
    setView((v) => ({ ...v, flyTo: { latitude: destination.latitude, longitude: destination.longitude, zoom: 13, key: Date.now() } }));
    if (!location.position) {
      setPreview({ status: 'idle', data: null, error: null });
      return undefined;
    }
    let cancelled = false;
    setPreview({ status: 'loading', data: null, error: null });
    mapService
      .route({
        from: { name: 'Current location', latitude: location.position.latitude, longitude: location.position.longitude },
        destination: { name: destination.name, latitude: destination.latitude, longitude: destination.longitude },
        routePreference: 'safest',
      })
      .then((data) => {
        if (cancelled) return;
        setPreview({ status: 'success', data, error: null });
        const coords = data.routes.flatMap((r) => r.geometry.coordinates);
        setView((v) => ({ ...v, fit: boundsOf(coords), fitKey: v.fitKey + 1 }));
      })
      .catch((error) => !cancelled && setPreview({ status: 'error', data: null, error }));
    return () => {
      cancelled = true;
    };
  }, [destination, location.position]);

  // Nearby places (emergency services) around the user or the map centre.
  useEffect(() => {
    if (!showPlaces) return undefined;
    const origin = location.position || mapCenter.current;
    if (!origin) return undefined;
    let cancelled = false;
    setPlaces({ status: 'loading', items: [] });
    mapService
      .nearby(origin, 'all', 4)
      .then((data) => {
        if (cancelled) return;
        const items = Object.values(data.categories).flat();
        setPlaces({ status: 'success', items });
        if (!items.length) setNotice('No nearby services found.');
      })
      .catch((error) => {
        if (cancelled) return;
        setPlaces({ status: 'error', items: [] });
        setNotice(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [showPlaces, location.position]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const handleSelectPlace = (place) => {
    setSearchQuery(place.name);
    setSearchFocused(false);
    setDestination(place);
  };

  const handleLocate = async () => {
    try {
      const pos = await location.request();
      setView((v) => ({ ...v, flyTo: { ...pos, zoom: 14, key: Date.now() } }));
    } catch (error) {
      setNotice(error.message);
    }
  };

  const handleVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice('Voice search is not supported in this browser.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.onresult = (e) => {
      setSearchQuery(e.results[0][0].transcript);
      setSearchFocused(true);
    };
    recognition.onerror = () => setNotice('Could not capture voice input.');
    recognition.start();
  };

  const recommended = preview.data?.routes?.[0];
  const markers = useMemo(() => {
    const list = [];
    if (location.position) list.push({ id: 'me', kind: 'current', ...location.position, label: 'You are here' });
    if (destination) list.push({ id: 'dest', kind: 'destination', latitude: destination.latitude, longitude: destination.longitude, label: destination.name });
    if (showPlaces) {
      places.items.forEach((p) =>
        list.push({
          id: p.id,
          kind: 'poi',
          category: p.category,
          latitude: p.latitude,
          longitude: p.longitude,
          label: `${p.name} (${p.categoryLabel})`,
          popup: `<div style="font-family:Poppins,sans-serif"><b style="font-size:12px">${p.name.replace(/</g, '&lt;')}</b><br/><span style="font-size:11px;color:#6B7280">${p.categoryLabel} · ${p.distanceText}</span></div>`,
        })
      );
    }
    return list;
  }, [location.position, destination, showPlaces, places.items]);

  const routes = useMemo(
    () => (preview.data?.routes || []).map((r) => ({ id: r.id, geometry: r.geometry, selected: r.id === recommended?.id })),
    [preview.data, recommended]
  );

  const sheetOpen = Boolean(destination);

  return (
    <div className="flex flex-col h-screen w-full bg-surface relative overflow-hidden">
      {/* Header - Absolute over Map */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-6 pb-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        {/* Increased mb-4 to mb-6 */}
        <div className="flex items-center justify-between mb-6 pointer-events-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-surface/90 backdrop-blur-md rounded-full shadow-soft hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide drop-shadow-md">Explore Map</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.ALERTS)}
              className="relative p-2 bg-surface/90 backdrop-blur-md rounded-full shadow-soft hover:bg-surface transition-colors"
            >
              <Bell className="w-5 h-5 text-text-primary" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white" />}
            </button>
            <button
              onClick={() => navigate(ROUTES.PROFILE)}
              className="p-2 bg-surface/90 backdrop-blur-md rounded-full shadow-soft hover:bg-surface transition-colors"
            >
              <User className="w-5 h-5 text-text-primary" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative pointer-events-auto">
          <div className="flex items-center bg-surface rounded-2xl px-4 py-3 shadow-lg border border-border/50 backdrop-blur-md">
            <Search className="w-5 h-5 text-text-secondary mr-3" />
            <input
              type="text"
              placeholder="Search destination..."
              className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && suggestions.results[0] && handleSelectPlace(suggestions.results[0])}
            />
            <button onClick={handleVoice} className="p-2 -mr-2 hover:bg-background rounded-full transition-colors">
              <Mic className="w-5 h-5 text-primary" />
            </button>
          </div>
          <PlaceSuggestions
            open={searchFocused && searchQuery.trim().length >= 3}
            results={suggestions.results}
            loading={suggestions.loading}
            error={suggestions.error}
            onSelect={handleSelectPlace}
          />
        </div>
      </div>

      {/* Map Area (Full Screen) */}
      <div className="absolute inset-0 bg-[#F1F5F9] z-0 overflow-hidden pb-20">
        <MapView
          center={initialCenter}
          zoom={13}
          zones={zones}
          routes={routes}
          markers={markers}
          fitBounds={view.fit}
          fitKey={view.fitKey}
          flyTo={view.flyTo}
          onBoundsChange={loadZones}
          padding={{ top: 170, bottom: sheetOpen ? 300 : 120, left: 40, right: 40 }}
          bottomInset={sheetOpen ? 300 : 98}
          className="absolute inset-0"
        />

        {/* Map Legend */}
        <div className={clsx('absolute left-4 bg-surface/90 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-border z-20 transition-all', sheetOpen ? 'bottom-[300px]' : 'bottom-28')}>
          <div className="flex items-center gap-1.5 mb-3">
            <Info className="w-3.5 h-3.5 text-text-secondary" />
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Map Legend</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center border border-success/30">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
              </div>
              <span className="text-xs font-semibold text-text-primary">Low Risk</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center border border-warning/30">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              </div>
              <span className="text-xs font-semibold text-text-primary">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center border border-danger/30">
                <ShieldAlert className="w-3.5 h-3.5 text-danger" />
              </div>
              <span className="text-xs font-semibold text-text-primary">High Risk</span>
            </div>
            <p className="text-[9px] text-text-secondary font-medium">Dashed outline = DEMO data</p>
          </div>
        </div>

        {/* Floating Actions on Map */}
        <div className={clsx('absolute right-4 flex flex-col gap-3 z-20 transition-all', sheetOpen ? 'bottom-[300px]' : 'bottom-28')}>
          <button
            onClick={() => setShowPlaces((v) => !v)}
            title="Nearby hospitals, police, pharmacies and petrol pumps"
            className={clsx(
              'w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-colors active:scale-95',
              showPlaces ? 'bg-primary text-white' : 'bg-surface text-text-primary hover:text-primary'
            )}
          >
            {places.status === 'loading' ? <Spinner className="w-5 h-5 border-white" /> : <Layers className="w-5 h-5" />}
          </button>
          <button
            onClick={handleLocate}
            className="w-11 h-11 bg-surface rounded-full shadow-lg flex items-center justify-center text-text-primary hover:text-primary transition-colors active:scale-95"
          >
            {location.status === 'loading' ? <Spinner /> : <LocateFixed className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate(ROUTES.EMERGENCY)}
            className="w-11 h-11 bg-danger rounded-full shadow-lg shadow-danger/30 flex items-center justify-center text-white hover:bg-red-600 transition-colors active:scale-95"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        </div>

        {(notice || zonesError) && (
          <div className="absolute top-[150px] left-4 right-4 z-30 bg-surface/95 backdrop-blur-md rounded-xl shadow-lg border border-border px-4 py-2.5 text-[12px] font-medium text-text-secondary">
            {notice || `Risk zones unavailable: ${zonesError}`}
          </div>
        )}
      </div>

      {/* Route Preview Card */}
      {sheetOpen && (
        <div className="absolute bottom-[80px] left-0 w-full z-20">
          <div className="bg-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 pb-6 border-t border-white/50">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-text-secondary uppercase">Destination</p>
                <p className="text-[14px] font-bold text-text-primary truncate flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-danger shrink-0" /> {destination.name}
                </p>
                <p className="text-[11px] text-text-secondary truncate">{destination.fullAddress || formatCoords(destination.latitude, destination.longitude)}</p>
              </div>
              <button onClick={() => setDestination(null)} className="p-1.5 rounded-full text-text-secondary hover:bg-black/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!location.position ? (
              <button onClick={handleLocate} className="w-full text-left bg-primary/5 border border-primary/20 rounded-xl p-3 text-[12px] font-medium text-text-secondary">
                <span className="text-primary font-bold">Share your location</span> to preview a route from where you are.
              </button>
            ) : preview.status === 'loading' ? (
              <div className="flex items-center gap-2 text-[12px] text-text-secondary py-3">
                <Spinner className="w-4 h-4" /> Calculating routes and checking risk zones…
              </div>
            ) : preview.status === 'error' ? (
              <p className="text-[12px] text-danger font-medium py-2">{preview.error.message}</p>
            ) : recommended ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-background rounded-xl p-2.5 border border-border">
                    <p className="text-[9px] text-text-secondary uppercase font-bold flex items-center gap-1"><Route className="w-3 h-3" /> Distance</p>
                    <p className="text-[13px] font-bold text-text-primary">{recommended.distanceText}</p>
                  </div>
                  <div className="bg-background rounded-xl p-2.5 border border-border">
                    <p className="text-[9px] text-text-secondary uppercase font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Time</p>
                    <p className="text-[13px] font-bold text-text-primary">{recommended.durationText}</p>
                  </div>
                  <div className="bg-background rounded-xl p-2.5 border border-border">
                    <p className="text-[9px] text-text-secondary uppercase font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Safety</p>
                    <p className={clsx('text-[13px] font-bold', RISK_TEXT[recommended.riskLevel])}>{recommended.safetyScore}/100</p>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary font-medium mb-3 line-clamp-2">
                  <span className={clsx('font-bold', RISK_TEXT[recommended.riskLevel])}>{RISK_LABEL[recommended.riskLevel]}.</span> {recommended.recommendation}
                </p>
              </>
            ) : null}

            <button
              onClick={() => navigate(ROUTES.TRIP_PLANNER, { state: { destination } })}
              className="w-full py-3 rounded-xl bg-primary text-white text-[13px] font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Navigation className="w-4 h-4" /> Plan Trip Here
            </button>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
};

export default LiveMapScreen;
