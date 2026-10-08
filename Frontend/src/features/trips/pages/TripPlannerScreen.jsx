import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpDown, Calendar, Users,
  ShieldCheck, Clock, Car, Bike, Bus, Train, Footprints,
  Zap, CircleOff, AlertTriangle, CloudSun, Route, Sparkles, Save, Minus, Plus
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ROUTES } from '../../../constants/routes';
import { TRAVEL_MODES, TRIP_TYPES, ROUTE_PREFERENCES } from '../../../constants/tripOptions';
import { clsx } from 'clsx';
import PlaceSuggestions, { usePlaceSearch } from '../../../components/common/PlaceSuggestions';
import { InlineNotice } from '../../../components/common/StateViews';
import { mapService } from '../../../services/mapService';
import { tripService } from '../../../services/tripService';
import { getCurrentPosition } from '../../../hooks/useGeolocation';
import { useJourney } from '../../../context/JourneyContext';
import { RISK_LABEL } from '../../../utils/format';

// Icon Map for dynamic icon rendering
const ICON_MAP = {
  Car, Bike, Bus, Train, Footprints, ShieldCheck, Zap, Clock, CircleOff, AlertTriangle
};

const RISK_TEXT = { LOW: 'text-success', MEDIUM: 'text-warning', HIGH: 'text-danger' };

const pad = (n) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Hides the native picker icon but keeps it clickable over the design's icon.
const NATIVE_PICKER =
  '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer';

const TripPlannerScreen = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const journey = useJourney();
  const presetDestination = routerLocation.state?.destination;

  // Form State
  const [formData, setFormData] = useState({
    from: '',
    to: presetDestination?.name || '',
    date: todayISO(),
    time: nowTime(),
    returnDate: '',
    travelers: 1
  });
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace, setToPlace] = useState(presetDestination || null);
  const [focused, setFocused] = useState(null); // 'from' | 'to' | null

  const [selectedMode, setSelectedMode] = useState(TRAVEL_MODES[0].id);
  const [tripType, setTripType] = useState(TRIP_TYPES[0].id);
  const [selectedPreference, setSelectedPreference] = useState(ROUTE_PREFERENCES[0].id);
  const [analysis, setAnalysis] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | analyzing | saving | starting
  const [error, setError] = useState('');

  const fromSearch = usePlaceSearch(formData.from, { enabled: focused === 'from' && !fromPlace });
  const toSearch = usePlaceSearch(formData.to, { enabled: focused === 'to' && !toPlace, near: fromPlace || undefined });

  const isAnalyzed = Boolean(analysis);
  const selectedRoute = useMemo(
    () => analysis?.routes.find((r) => r.id === selectedRouteId) || analysis?.routes[0],
    [analysis, selectedRouteId]
  );

  const resetAnalysis = () => {
    setAnalysis(null);
    setSelectedRouteId(null);
  };

  const handleSwap = () => {
    setFormData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
    setFromPlace(toPlace);
    setToPlace(fromPlace);
    resetAnalysis();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (name === 'from') setFromPlace(null);
    if (name === 'to') setToPlace(null);
    resetAnalysis();
    setError('');
  };

  const changeTravelers = (delta) => {
    setFormData((prev) => ({ ...prev, travelers: Math.min(50, Math.max(1, Number(prev.travelers) + delta)) }));
  };

  const pickPlace = (field, place) => {
    setFormData((prev) => ({ ...prev, [field]: place.fullAddress || place.name }));
    if (field === 'from') setFromPlace(place);
    else setToPlace(place);
    setFocused(null);
    resetAnalysis();
  };

  const useCurrentLocationAsFrom = async () => {
    setFocused(null);
    setError('');
    try {
      const pos = await getCurrentPosition();
      let name = 'Current location';
      try {
        const place = await mapService.reverseGeocode(pos);
        name = place.fullAddress || place.name || name;
      } catch {
        /* keep generic name */
      }
      pickPlace('from', { name, fullAddress: name, latitude: pos.latitude, longitude: pos.longitude });
    } catch (err) {
      setError(err.message);
    }
  };

  const departureISO = () => new Date(`${formData.date}T${formData.time || '00:00'}`).toISOString();

  const handleAnalyze = async () => {
    setError('');
    if (!fromPlace || !toPlace) {
      setError('Choose both places from the suggestions so we can find exact coordinates.');
      return;
    }
    if (!formData.date) {
      setError('Select a travel date.');
      return;
    }
    setStatus('analyzing');
    try {
      const data = await mapService.route({
        from: { name: fromPlace.name, latitude: fromPlace.latitude, longitude: fromPlace.longitude },
        destination: { name: toPlace.name, latitude: toPlace.latitude, longitude: toPlace.longitude },
        travelMode: selectedMode,
        routePreference: selectedPreference,
        departureTime: departureISO(),
        steps: true,
      });
      setAnalysis(data);
      setSelectedRouteId(data.recommendedRouteId);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('idle');
    }
  };

  const saveTrip = async () => {
    const payload = {
      from: { name: fromPlace.name, latitude: fromPlace.latitude, longitude: fromPlace.longitude },
      destination: { name: toPlace.name, latitude: toPlace.latitude, longitude: toPlace.longitude },
      travelDate: departureISO(),
      travelers: Number(formData.travelers),
      travelMode: selectedMode,
      routePreference: selectedPreference,
      selectedRoute: selectedRoute && {
        geometry: selectedRoute.geometry,
        distance: selectedRoute.distance,
        duration: selectedRoute.duration,
        summary: selectedRoute.summary,
        steps: selectedRoute.steps,
        profile: selectedRoute.profile,
      },
    };
    const trip = await tripService.create(payload);
    // Round trip: the return leg is saved as its own planned trip (route computed by the server).
    if (tripType === 'round-trip' && formData.returnDate) {
      await tripService.create({
        ...payload,
        from: payload.destination,
        destination: payload.from,
        travelDate: new Date(`${formData.returnDate}T${formData.time || '00:00'}`).toISOString(),
        selectedRoute: undefined,
      });
    }
    return trip;
  };

  const handleSave = async () => {
    setError('');
    setStatus('saving');
    try {
      const trip = await saveTrip();
      navigate(`${ROUTES.TRIP_DETAILS}/${trip.id}`);
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const handleStart = async () => {
    setError('');
    if (journey.isActive) {
      setError('You already have an active journey. End it from Live Tracking first.');
      return;
    }
    setStatus('starting');
    let trip;
    try {
      trip = await saveTrip();
      await journey.startJourney(trip.id);
      navigate(ROUTES.LIVE_TRACKING);
    } catch (err) {
      setError(trip ? `Trip saved, but the journey could not start: ${err.message}` : err.message);
      setStatus('idle');
    }
  };

  const busy = status !== 'idle';

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-background flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-surface sticky top-0 z-10 border-b border-border shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold text-text-primary absolute left-1/2 -translate-x-1/2 tracking-wide">
          Plan Your Trip
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-[120px] pt-4 scrollbar-hide">

        {/* Travel Mode Selector */}
        <div className="mb-6">
          <label className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-3 block">Travel Mode</label>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TRAVEL_MODES.map(mode => {
              const Icon = ICON_MAP[mode.icon];
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    resetAnalysis();
                  }}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-2xl border transition-all active:scale-95 shrink-0",
                    isSelected
                      ? "bg-primary border-primary shadow-md shadow-primary/20 text-white"
                      : "bg-surface border-border text-text-secondary hover:border-primary/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>

          {/* Trip Type Toggle */}
          <div className="flex bg-surface border border-border rounded-xl p-1">
            {TRIP_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setTripType(type.id)}
                className={clsx(
                  "flex-1 py-2 text-xs font-bold rounded-lg transition-colors",
                  tripType === type.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:bg-background"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* From & To Fields with Swap Button */}
          <div className="relative z-20 flex flex-col gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm">
            {/* From */}
            <div className="flex flex-col gap-1.5 border-b border-border pb-3 relative">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">From</label>
              <input
                type="text"
                name="from"
                placeholder="Search starting point"
                autoComplete="off"
                value={formData.from}
                onChange={handleChange}
                onFocus={() => setFocused('from')}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent border-none text-sm font-semibold text-text-primary placeholder:text-text-secondary outline-none pr-10"
              />
              <PlaceSuggestions
                open={focused === 'from' && !fromPlace}
                results={fromSearch.results}
                loading={fromSearch.loading}
                error={fromSearch.error}
                onSelect={(p) => pickPlace('from', p)}
                onUseCurrentLocation={useCurrentLocationAsFrom}
              />
            </div>

            {/* To */}
            <div className="flex flex-col gap-1.5 pt-1 relative">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">To</label>
              <input
                type="text"
                name="to"
                placeholder="Search destination"
                autoComplete="off"
                value={formData.to}
                onChange={handleChange}
                onFocus={() => setFocused('to')}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent border-none text-sm font-semibold text-text-primary placeholder:text-text-secondary outline-none pr-10"
              />
              <PlaceSuggestions
                open={focused === 'to' && !toPlace && formData.to.trim().length >= 3}
                results={toSearch.results}
                loading={toSearch.loading}
                error={toSearch.error}
                onSelect={(p) => pickPlace('to', p)}
              />
            </div>

            {/* Swap Button */}
            <button
              type="button"
              onClick={handleSwap}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-background rounded-full flex items-center justify-center text-primary hover:bg-primary/10 active:scale-95 transition-all border border-border shadow-sm z-10"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Date & Time Row */}
          <div className="flex gap-4">
            {/* Travel Date */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Departure Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  min={todayISO()}
                  value={formData.date}
                  onChange={handleChange}
                  className={clsx("w-full bg-surface border border-border rounded-xl px-3 py-3 pr-10 text-xs font-semibold text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm", NATIVE_PICKER)}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
              </div>
            </div>

            {/* Departure Time */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Departure Time</label>
              <div className="relative">
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={clsx("w-full bg-surface border border-border rounded-xl px-3 py-3 pr-10 text-xs font-semibold text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm", NATIVE_PICKER)}
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Travelers */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Travelers</label>
            <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <Users className="w-4 h-4 text-primary" />
                {formData.travelers} {Number(formData.travelers) === 1 ? 'Traveler' : 'Travelers'}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => changeTravelers(-1)} className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-primary active:scale-95" aria-label="Fewer travelers">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => changeTravelers(1)} className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-primary active:scale-95" aria-label="More travelers">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Return Date (Conditional) */}
          {tripType === 'round-trip' && (
            <div className="flex flex-col gap-1.5 transition-all">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Return Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="returnDate"
                  min={formData.date || todayISO()}
                  value={formData.returnDate}
                  onChange={handleChange}
                  className={clsx("w-full bg-surface border border-border rounded-xl px-4 py-3.5 pr-10 text-sm font-semibold text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm", NATIVE_PICKER)}
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
              </div>
            </div>
          )}

          {/* Route Preferences */}
          <div className="mt-4">
            <label className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-3 block">Route Preferences</label>

            <div className="flex flex-col gap-2.5">
              {ROUTE_PREFERENCES.map((pref) => {
                const isSelected = selectedPreference === pref.id;
                const Icon = ICON_MAP[pref.icon];

                return (
                  <button
                    type="button"
                    key={pref.id}
                    onClick={() => {
                      setSelectedPreference(pref.id);
                      resetAnalysis();
                    }}
                    className={clsx(
                      "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all active:scale-[0.98]",
                      isSelected
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "bg-surface border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isSelected ? "bg-primary text-white" : "bg-background text-text-secondary"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={clsx("text-[13px] font-semibold", isSelected ? "text-primary" : "text-text-primary")}>
                        {pref.label}
                      </span>
                    </div>

                    {pref.recommended && isSelected && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide bg-primary/10 px-2 py-1 rounded-md">Recommended</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <InlineNotice tone="danger">{error}</InlineNotice>}

          {/* Actions */}
          {!isAnalyzed ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleAnalyze}
              isLoading={status === 'analyzing'}
              className="w-full mt-6 py-4 rounded-xl text-sm font-bold shadow-lg shadow-primary/25"
            >
              {status === 'analyzing' ? 'Analyzing Routes…' : 'Analyze Route'}
            </Button>
          ) : (
            <div className="mt-6 flex flex-col gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
              {/* AI Recommendation Card */}
              <div className="bg-surface border border-primary/20 rounded-2xl p-5 shadow-lg shadow-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-4 -mt-4" />

                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-primary text-sm">AI Route Insight</h3>
                </div>

                {analysis.routes.length > 1 && (
                  <div className="flex gap-2 mb-4 relative z-10 overflow-x-auto scrollbar-hide">
                    {analysis.routes.map((route, index) => (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => setSelectedRouteId(route.id)}
                        className={clsx(
                          'shrink-0 px-3 py-2 rounded-xl border text-left transition-all',
                          route.id === selectedRoute.id ? 'border-primary bg-primary/5' : 'border-border bg-background'
                        )}
                      >
                        <p className="text-[10px] font-bold text-text-secondary uppercase">
                          {route.recommended ? 'Best match' : `Option ${index + 1}`}
                        </p>
                        <p className="text-[11px] font-bold text-text-primary">
                          {route.durationText} · <span className={RISK_TEXT[route.riskLevel]}>{route.safetyScore}/100</span>
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
                  <div className="bg-background rounded-xl p-3 border border-border">
                    <p className="text-[10px] text-text-secondary uppercase font-bold mb-1">Distance</p>
                    <p className="text-sm font-bold text-text-primary">{selectedRoute.distanceText}</p>
                  </div>
                  <div className="bg-background rounded-xl p-3 border border-border">
                    <p className="text-[10px] text-text-secondary uppercase font-bold mb-1">Est. Time</p>
                    <p className="text-sm font-bold text-text-primary">{selectedRoute.durationText}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 relative z-10 border-t border-border/50 pt-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className={clsx('w-4 h-4 mt-0.5', RISK_TEXT[selectedRoute.riskLevel])} />
                    <div>
                      <p className={clsx('text-xs font-bold mb-0.5', RISK_TEXT[selectedRoute.riskLevel])}>
                        {RISK_LABEL[selectedRoute.riskLevel]} · Safety score {selectedRoute.safetyScore}/100
                      </p>
                      <p className="text-xs text-text-secondary font-medium">{selectedRoute.recommendation}</p>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-1 pl-7">
                    {selectedRoute.factors.map((f) => (
                      <li key={f.label} className="text-[11px] text-text-secondary font-medium flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', f.kind === 'negative' ? 'bg-danger' : f.kind === 'positive' ? 'bg-success' : 'bg-text-secondary')} />
                          {f.label}
                        </span>
                        {f.impact !== 0 && <span className="font-bold text-danger shrink-0">{f.impact}</span>}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-start gap-3 mt-1">
                    <CloudSun className="w-4 h-4 text-warning mt-0.5" />
                    <p className="text-xs text-text-secondary font-medium">
                      {analysis.weather.destination?.summary
                        ? `At destination: ${analysis.weather.destination.summary}`
                        : 'Weather data is currently unavailable.'}
                    </p>
                  </div>
                  {analysis.note && <p className="text-[11px] text-text-secondary italic">{analysis.note}</p>}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleSave}
                  disabled={busy}
                  isLoading={status === 'saving'}
                  className="flex-1 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  {status !== 'saving' && <Save className="w-4 h-4" />}
                  Save Trip
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleStart}
                  disabled={busy}
                  isLoading={status === 'starting'}
                  className="flex-[1.4] py-4 rounded-xl text-sm font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  {status !== 'starting' && <Route className="w-4 h-4" />}
                  Start Journey
                </Button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default TripPlannerScreen;
