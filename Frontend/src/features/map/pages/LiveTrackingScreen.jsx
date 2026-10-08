import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Navigation, MapPin, AlertTriangle, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../../../components/ui/Button';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import MapView from '../../../components/map/MapView';
import { InlineNotice, LoadingState } from '../../../components/common/StateViews';
import { ROUTES } from '../../../constants/routes';
import { useJourney } from '../../../context/JourneyContext';
import { useNotifications } from '../../../context/NotificationContext';
import { riskService } from '../../../services/riskService';
import { boundsOf, formatDistance, formatDuration } from '../../../utils/format';

const RISK_BADGE = {
  LOW: { box: 'bg-[#ECFDF5] border-[#A7F3D0]', text: 'text-success', label: 'Lower Risk', Icon: ShieldCheck },
  MEDIUM: { box: 'bg-[#FFFBEB] border-[#FDE68A]', text: 'text-warning', label: 'Medium Risk', Icon: AlertTriangle },
  HIGH: { box: 'bg-[#FEF2F2] border-[#FECACA]', text: 'text-danger', label: 'High Risk', Icon: ShieldAlert },
};

/** Next maneuver ahead of the travelled distance along the route. */
const nextTurn = (steps, travelled) => {
  if (!steps?.length || !Number.isFinite(travelled)) return null;
  let cumulative = 0;
  for (const step of steps) {
    if (cumulative > travelled + 5 && step.instruction) {
      return { instruction: step.instruction, inMeters: cumulative - travelled };
    }
    cumulative += step.distance || 0;
  }
  return { instruction: 'Arrive at your destination', inMeters: Math.max(cumulative - travelled, 0) };
};

const LiveTrackingScreen = () => {
  const navigate = useNavigate();
  const journey = useJourney();
  const { notifications } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const [zones, setZones] = useState(null);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState('');
  const [follow, setFollow] = useState({ key: 0 });
  const lastFollow = useRef(0);

  const { trip, position, liveStatus, isActive } = journey;
  const route = trip?.selectedRoute;

  // Risk zones along the route (loaded once per trip).
  useEffect(() => {
    if (!trip) return;
    const coords = route?.geometry?.coordinates || [
      [trip.from.longitude, trip.from.latitude],
      [trip.destination.longitude, trip.destination.latitude],
    ];
    const b = boundsOf(coords);
    riskService
      .list({ bbox: `${b[0][0] - 0.02},${b[0][1] - 0.02},${b[1][0] + 0.02},${b[1][1] + 0.02}` })
      .then(setZones)
      .catch(() => setZones(null));
  }, [trip, route]);

  // Follow the live marker, at most every 4 seconds.
  useEffect(() => {
    if (!position) return;
    const now = Date.now();
    if (now - lastFollow.current < 4000) return;
    lastFollow.current = now;
    setFollow({ key: now });
  }, [position]);

  const latestAlert = useMemo(() => {
    if (!trip) return null;
    return notifications.find(
      (n) => n.data?.tripId === trip.id && ['RISK_ALERT', 'WEATHER_ALERT'].includes(n.type) && Date.now() - new Date(n.createdAt) < 30 * 60 * 1000
    ) || notifications.find((n) => n.data?.tripId === trip.id && n.title === 'Route deviation detected' && Date.now() - new Date(n.createdAt) < 10 * 60 * 1000);
  }, [notifications, trip]);

  const markers = useMemo(() => {
    if (!trip) return [];
    const list = [{ id: 'dest', kind: 'destination', latitude: trip.destination.latitude, longitude: trip.destination.longitude, label: trip.destination.name }];
    if (position) list.push({ id: 'me', kind: 'current', latitude: position.latitude, longitude: position.longitude, label: 'You' });
    return list;
  }, [trip, position]);

  const routes = useMemo(() => (route?.geometry ? [{ id: 'trip', geometry: route.geometry, selected: true }] : []), [route]);

  if (!journey.checked) {
    return (
      <div className="flex flex-col h-screen w-full bg-surface items-center justify-center">
        <LoadingState label="Checking for an active journey…" />
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="flex flex-col h-screen w-full bg-surface relative overflow-hidden font-sans">
        <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-surface z-20 border-b border-border shadow-sm">
          <button onClick={() => navigate(ROUTES.HOME)} className="p-2 -ml-2 rounded-full hover:bg-black/5">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <h1 className="text-[16px] font-bold text-text-primary">Live Tracking</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Navigation className="w-8 h-8 text-primary opacity-50" />
          </div>
          <h2 className="text-[18px] font-bold text-text-primary mb-2">Live tracking is not available.</h2>
          <p className="text-[13px] text-text-secondary font-medium mb-8">
            Start a journey to enable live tracking.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(ROUTES.TRIP_PLANNER)}
            className="w-full py-3.5 rounded-xl font-bold"
          >
            Plan a Trip
          </Button>
          <button onClick={() => navigate(ROUTES.MY_TRIPS)} className="mt-4 text-primary text-[13px] font-bold">
            Start a saved trip
          </button>
        </div>

        <BottomNavBar />
      </div>
    );
  }

  const progress = liveStatus?.progress;
  const remainingMeters = progress?.remaining;
  const etaSeconds =
    progress && route?.duration && progress.total > 0 ? (route.duration * progress.remaining) / progress.total : route?.duration;
  const turn = nextTurn(route?.steps, progress?.travelled);
  const risk = liveStatus?.risk;
  const badge = RISK_BADGE[risk?.riskLevel] || null;
  const locationError = journey.error?.code ? journey.error.message : null;

  const handleEnd = async () => {
    if (!window.confirm('End this journey? Live tracking will stop.')) return;
    setEnding(true);
    setEndError('');
    try {
      const ended = await journey.endJourney();
      navigate(`${ROUTES.TRIP_DETAILS}/${ended.id}`, { replace: true });
    } catch (error) {
      setEndError(error.message);
      setEnding(false);
    }
  };

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-[#e5e9ea] flex flex-col font-sans overflow-hidden">

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 pt-6 z-20 flex flex-col gap-3 pointer-events-none">
        <div className="flex justify-between items-center w-full pointer-events-auto">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>

          <h1 className="text-lg font-bold text-text-primary bg-white/90 backdrop-blur-md px-5 py-2 rounded-full shadow-soft">
            Live Tracking
          </h1>

          <button
            onClick={() => navigate(ROUTES.EMERGENCY)}
            className="w-10 h-10 rounded-full bg-danger flex items-center justify-center shadow-lg shadow-danger/40 active:scale-95 transition-all animate-pulse"
          >
            <ShieldAlert className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Compact Trip Info Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-border pointer-events-auto mx-auto w-full max-w-sm mt-2">
          <div className="relative">
            <div className="absolute left-[11px] top-6 bottom-6 w-[2px] bg-border border-dashed border-l-2" />

            <div className="flex items-center gap-4 mb-4 relative z-10">
               <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                 <div className="w-2 h-2 bg-primary rounded-full" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-bold text-text-secondary uppercase">From</p>
                 <p className="text-sm font-semibold text-text-primary truncate">{trip.from.name}</p>
               </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
               <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center shrink-0 border border-danger/20">
                 <MapPin className="w-3 h-3 text-danger" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-bold text-text-secondary uppercase">To</p>
                 <p className="text-sm font-semibold text-text-primary truncate">{trip.destination.name}</p>
               </div>
            </div>
          </div>
        </div>

        {locationError && (
          <InlineNotice tone="danger" className="pointer-events-auto bg-white">
            {journey.error.code === 'denied' ? 'Location permission is required for live tracking.' : locationError}
          </InlineNotice>
        )}
      </div>

      {/* Map Area (Background) */}
      <div className="absolute inset-0 z-0 bg-[#F1F5F9]">
        <MapView
          center={position || { latitude: trip.from.latitude, longitude: trip.from.longitude }}
          zoom={15}
          zones={zones}
          routes={routes}
          markers={markers}
          flyTo={position ? { latitude: position.latitude, longitude: position.longitude, zoom: 15, key: follow.key } : null}
          bottomInset={isExpanded ? 470 : 255}
          className="absolute inset-0"
        />
      </div>

      {/* Bottom Information Card (Journey Progress) */}
      <div className="absolute bottom-[80px] left-0 w-full z-20">
        <div className="bg-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-white/50 transition-all duration-300">

          {/* Pull Tab / Header */}
          <div
            className="w-full flex flex-col items-center cursor-pointer mb-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-12 h-1.5 bg-border rounded-full mb-4" />
          </div>

          <div
            className="flex justify-between items-start cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div>
              <h2 className="text-[22px] font-black text-text-primary mb-1">
                {Number.isFinite(etaSeconds) ? formatDuration(etaSeconds) : '—'} <span className="text-[14px] text-text-secondary font-medium">ETA</span>
              </h2>
              <p className="text-[14px] font-bold text-text-secondary flex items-center gap-1">
                <Navigation className="w-4 h-4 text-primary" />
                {Number.isFinite(remainingMeters) ? `${formatDistance(remainingMeters)} remaining` : position ? 'Calculating…' : 'Waiting for GPS…'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {badge ? (
                <div className={clsx('border px-3 py-1.5 rounded-lg flex items-center gap-1.5', badge.box)}>
                  <badge.Icon className={clsx('w-4 h-4', badge.text)} />
                  <span className={clsx('text-[11px] font-bold uppercase', badge.text)}>{badge.label}</span>
                </div>
              ) : (
                <div className="bg-background border border-border px-3 py-1.5 rounded-lg text-[11px] font-bold text-text-secondary uppercase">Checking…</div>
              )}
              {liveStatus?.weather && (
                <span className="text-[11px] font-semibold text-text-secondary">
                  {liveStatus.weather.icon} {Math.round(liveStatus.weather.temperature)}°C
                </span>
              )}
            </div>
          </div>

          {/* Expandable Content */}
          <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0 m-0'}`}>
            <div className="space-y-3 mb-6">
            {/* Live Progress */}
            <div className="flex items-center gap-3 bg-background p-3 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-secondary uppercase font-bold">Next Turn</p>
                <p className="text-[13px] font-bold text-text-primary truncate">
                  {turn ? `In ${formatDistance(turn.inMeters)}, ${turn.instruction}` : 'Turn-by-turn directions are not available for this trip.'}
                </p>
              </div>
            </div>

            {/* Safety Alerts */}
            <div className={clsx('flex items-center gap-3 p-3 rounded-xl border', latestAlert || risk?.riskLevel === 'HIGH' ? 'bg-danger/5 border-danger/20' : 'bg-background border-border')}>
              <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center shrink-0', latestAlert ? 'bg-danger/10' : 'bg-success/10')}>
                {latestAlert ? <AlertTriangle className="w-4 h-4 text-danger" /> : <ShieldCheck className="w-4 h-4 text-success" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-[10px] uppercase font-bold', latestAlert ? 'text-danger' : 'text-text-secondary')}>Live Alert</p>
                <p className="text-[12px] font-medium text-text-primary">
                  {latestAlert ? latestAlert.message : risk?.message || 'No active alerts on your route.'}
                </p>
              </div>
            </div>
            {liveStatus?.deviation?.offRoute && (
              <p className="text-[11px] font-bold text-warning">You are about {formatDistance(liveStatus.deviation.distance)} off your planned route.</p>
            )}
          </div>

            {endError && <InlineNotice tone="danger" className="mb-3">{endError}</InlineNotice>}
            <Button
              variant="outline"
              onClick={handleEnd}
              isLoading={ending}
              className="w-full py-3.5 text-[14px] font-bold border-danger/50 text-danger hover:bg-danger/10"
            >
              End Journey
            </Button>
          </div>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default LiveTrackingScreen;
