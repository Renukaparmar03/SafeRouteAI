import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, AlertTriangle,
  CloudSun, Navigation, Sparkles, MapPin,
  Info, Map, AlertCircle, Car, Cross,
  Shield, Pill, Fuel, Thermometer, Droplets, ArrowRight, LocateFixed
} from 'lucide-react';
import { clsx } from 'clsx';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import Button from '../../../components/ui/Button';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { ROUTES } from '../../../constants/routes';
import { useCurrentLocation } from '../../../hooks/useGeolocation';
import { safetyService } from '../../../services/riskService';
import { emergencyService } from '../../../services/emergencyService';
import { RISK_LABEL, SOURCE_LABEL, formatCoords } from '../../../utils/format';

const ICON_MAP = {
  Map, AlertCircle, Car, Cross, Shield, Pill, Fuel, Info
};

const LEVEL_TONE = {
  LOW: { text: 'text-success', ring: 'text-success/20', card: 'bg-[#ECFDF5] border-[#A7F3D0]', icon: 'bg-success shadow-success/30', glow: 'bg-success/10', border: 'border-success/10' },
  MEDIUM: { text: 'text-warning', ring: 'text-warning/20', card: 'bg-[#FFFBEB] border-[#FDE68A]', icon: 'bg-warning shadow-warning/30', glow: 'bg-warning/10', border: 'border-warning/10' },
  HIGH: { text: 'text-danger', ring: 'text-danger/20', card: 'bg-[#FEF2F2] border-[#FECACA]', icon: 'bg-danger shadow-danger/30', glow: 'bg-danger/10', border: 'border-danger/10' },
};

const SLOT_COLOR = {
  Excellent: 'bg-success text-white',
  Good: 'bg-[#10B981] text-white',
  Moderate: 'bg-warning text-white',
  'High Risk': 'bg-danger text-white',
};

const SERVICE_TILES = [
  { id: 'hospital', label: 'Hospital', icon: 'Cross' },
  { id: 'police', label: 'Police Station', icon: 'Shield' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'Pill' },
  { id: 'fuel', label: 'Petrol Pump', icon: 'Fuel' },
];

const CircularProgress = ({ score, status, tone }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className={tone.ring}
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={clsx(tone.text, 'transition-all duration-1000 ease-out')}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx('text-[16px] font-black leading-none', tone.text)}>{score}</span>
        </div>
      </div>
      <span className={clsx('text-[10px] font-bold uppercase tracking-wider mt-1.5 bg-white px-2 py-0.5 rounded-full shadow-sm', tone.text)}>{status}</span>
    </div>
  );
};

const SafetyCheckScreen = () => {
  const navigate = useNavigate();
  // This screen needs the user's location, so it asks for it on open.
  const location = useCurrentLocation('auto');
  const [check, setCheck] = useState({ status: 'idle', data: null, error: null });
  const [services, setServices] = useState({ status: 'idle', data: null, error: null });

  const load = useCallback(async (position) => {
    setCheck({ status: 'loading', data: null, error: null });
    setServices({ status: 'loading', data: null, error: null });
    safetyService
      .check(position)
      .then((data) => setCheck({ status: 'success', data, error: null }))
      .catch((error) => setCheck({ status: 'error', data: null, error }));
    emergencyService
      .services(position, 'all', 1)
      .then((data) => setServices({ status: 'success', data, error: null }))
      .catch((error) => setServices({ status: 'error', data: null, error }));
  }, []);

  useEffect(() => {
    if (location.position) load(location.position);
  }, [location.position, load]);

  const data = check.data;
  const tone = LEVEL_TONE[data?.riskLevel] || LEVEL_TONE.LOW;

  const openOnMap = (place) =>
    navigate(ROUTES.MAP, {
      state: { destination: { name: place.name, fullAddress: place.address || place.categoryLabel, latitude: place.latitude, longitude: place.longitude } },
    });

  const renderBody = () => {
    if (location.status === 'error') {
      return (
        <ErrorState
          message={location.error.code === 'denied' ? 'Location permission is required for a safety check of your area.' : location.error.message}
          onRetry={() => location.request().catch(() => {})}
        />
      );
    }
    if (!location.position) return <LoadingState label="Getting your location…" />;
    if (check.status === 'loading' || check.status === 'idle') return <LoadingState label="Checking weather, risk zones and alerts…" />;
    if (check.status === 'error') return <ErrorState message={check.error.message} onRetry={() => load(location.position)} />;

    return (
      <>
        {/* Main Status Card */}
        <div className={clsx('border rounded-2xl p-5 mb-6 relative overflow-hidden shadow-sm flex flex-col', tone.card)}>
          <div className={clsx('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10', tone.glow)} />

          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="flex items-center gap-3">
              <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center shadow-lg', tone.icon)}>
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={clsx('text-[11px] font-bold uppercase tracking-wider mb-0.5', tone.text)}>Current Area Status</p>
                <h2 className="text-[18px] font-black text-text-primary leading-tight">{data.label}</h2>
                <p className="text-[10px] font-medium text-text-secondary flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {data.location.name || formatCoords(data.location.latitude, data.location.longitude)}
                </p>
              </div>
            </div>

            <CircularProgress score={data.score} status={data.status} tone={tone} />
          </div>

          <p className={clsx('text-[13px] font-medium text-text-secondary leading-relaxed relative z-10 bg-white/60 p-3 rounded-xl border', tone.border)}>
            {data.description}
          </p>

          {/* Explainable score */}
          <ul className="relative z-10 mt-3 flex flex-col gap-1">
            {data.factors.map((f) => (
              <li key={f.label} className="text-[11px] text-text-secondary font-medium flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', f.kind === 'negative' ? 'bg-danger' : f.kind === 'positive' ? 'bg-success' : 'bg-text-secondary')} />
                  {f.label}
                </span>
                {f.impact !== 0 && <span className="font-bold text-danger">{f.impact}</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Today's Safety Summary */}
        <div className="mb-6">
          <h3 className="text-[14px] font-bold text-text-primary mb-3">Today's Safety Forecast</h3>
          <div className="grid grid-cols-4 gap-2">
            {data.forecast.map(slot => (
              <div key={slot.id} className="bg-surface border border-border rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">{slot.time}</span>
                <div className={`w-full py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${SLOT_COLOR[slot.status]}`}>
                  {slot.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 border-b border-primary/10 pb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-primary text-[14px]">AI Safety Advice</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {data.advice.map(rec => {
              const Icon = ICON_MAP[rec.icon] || Info;
              return (
                <div key={rec.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-primary/10 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[13px] text-text-primary font-medium leading-relaxed">{rec.text}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate(ROUTES.ASSISTANT)} className="mt-3 text-[12px] font-bold text-primary flex items-center gap-1">
            Ask the AI assistant <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Two-Column Grid: Weather & Alerts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Weather */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <CloudSun className="w-4 h-4 text-warning" />
              </div>
              <span className="text-[12px] font-bold text-text-primary">Weather</span>
            </div>
            {data.weather ? (
              <div className="flex flex-col gap-1.5 mt-auto">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-text-secondary font-medium">Condition</span>
                  <span className="text-[11px] text-text-primary font-bold text-right">{data.weather.condition}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary font-medium flex items-center gap-1"><Thermometer className="w-3 h-3"/> Temp</span>
                  <span className="text-[11px] text-text-primary font-bold">{Math.round(data.weather.temperature)}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary font-medium flex items-center gap-1"><Droplets className="w-3 h-3"/> Rain</span>
                  <span className="text-[11px] text-text-primary font-bold">
                    {Number.isFinite(data.weather.precipitationProbability) ? `${data.weather.precipitationProbability}%` : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-text-secondary font-medium mt-auto">Weather data is currently unavailable.</p>
            )}
          </div>

          {/* Road Alerts */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
             <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-danger" />
              </div>
              <span className="text-[12px] font-bold text-text-primary">Road Alerts</span>
            </div>
            <div className="mt-auto">
              <p className={clsx('text-[18px] font-black mb-1', data.roadAlerts.count ? 'text-danger' : 'text-success')}>{data.roadAlerts.count}</p>
              <p className="text-[11px] text-text-secondary font-medium leading-snug">
                {data.roadAlerts.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Nearby Risk Zones */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-text-primary">Nearby Risk Zones</h3>
            <span className={clsx('text-[11px] font-bold px-2 py-1 rounded-md', data.riskZones.length ? 'text-danger bg-danger/10' : 'text-success bg-success/10')}>
              {data.riskZones.length} Detected
            </span>
          </div>

          {data.riskZones.length === 0 ? (
            <p className="text-[12px] text-text-secondary font-medium bg-surface border border-border rounded-2xl p-4">
              No mapped risk zones within 5 km. This only reflects the data available to SafeRoute AI.
            </p>
          ) : (
          <div className="flex flex-col gap-3">
            {data.riskZones.map((zone) => {
              const zoneTone = LEVEL_TONE[zone.riskLevel];
              return (
              <div key={zone.id} className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center shrink-0', zoneTone.glow)}>
                    <AlertTriangle className={clsx('w-5 h-5', zoneTone.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-[13px] font-bold text-text-primary truncate">{zone.name}</h4>
                      <span className="text-[10px] font-bold text-text-secondary flex items-center gap-1 shrink-0"><MapPin className="w-3 h-3"/> {zone.distanceText}</span>
                    </div>
                    <p className={clsx('text-[11px] font-bold mb-1', zoneTone.text)}>{RISK_LABEL[zone.riskLevel]}</p>
                    <p className="text-[11px] text-text-secondary font-medium flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      {zone.description || 'No description provided.'}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-1">
                      Source: {SOURCE_LABEL[zone.sourceType]} · Confidence {Math.round(zone.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.MAP, { state: { focusZone: zone } })}
                  className="w-full py-2 text-[11px] h-auto rounded-lg border-border/80 flex items-center justify-center gap-1.5"
                >
                  <Map className="w-3.5 h-3.5" /> View on Map
                </Button>
              </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Nearby Emergency Services */}
        <div className="mb-6">
          <h3 className="text-[14px] font-bold text-text-primary mb-4">Nearby Emergency Services</h3>
          {services.status === 'loading' ? (
            <LoadingState label="Finding nearby services…" className="py-4" />
          ) : services.status === 'error' ? (
            <ErrorState message={services.error.message} onRetry={() => load(location.position)} className="py-4" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {SERVICE_TILES.map((tile) => {
                const Icon = ICON_MAP[tile.icon];
                const place = services.data?.categories?.[tile.id]?.[0];
                return (
                  <button
                    key={tile.id}
                    disabled={!place}
                    onClick={() => place && openOnMap(place)}
                    className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm flex flex-col items-start text-left active:scale-[0.98] transition-all disabled:opacity-70"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[12px] font-bold text-text-primary">{tile.label}</span>
                    </div>
                    {place ? (
                      <>
                        <p className="text-[11px] font-semibold text-text-primary truncate w-full">{place.name}</p>
                        <p className="text-[10px] text-text-secondary font-medium flex items-center gap-1"><MapPin className="w-3 h-3" /> {place.distanceText}</p>
                      </>
                    ) : (
                      <p className="text-[11px] text-text-secondary font-medium">None found nearby</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[10px] text-text-secondary text-center">{data.disclaimer}</p>
      </>
    );
  };

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-background flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-surface sticky top-0 z-20 border-b border-border shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold text-text-primary absolute left-1/2 -translate-x-1/2 tracking-wide">
          Safety Check
        </h1>
        <button
          onClick={() => location.request().catch(() => {})}
          className="p-2 -mr-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95"
          aria-label="Refresh location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[120px] scrollbar-hide">
        {renderBody()}
      </div>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

export default SafetyCheckScreen;
