import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, AlertTriangle, ShieldCheck, CloudSun, Clock, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { LABELS } from '../../../constants/labels';
import { ROUTES } from '../../../constants/routes';
import Button from '../../../components/ui/Button';
import MapView from '../../../components/map/MapView';
import { ErrorState, InlineNotice, LoadingState } from '../../../components/common/StateViews';
import { useAsync } from '../../../hooks/useAsync';
import { tripService } from '../../../services/tripService';
import { useJourney } from '../../../context/JourneyContext';
import { RISK_LABEL, boundsOf, formatDate, formatDateTime, formatDistance, timeAgo } from '../../../utils/format';

const RISK_TEXT = { LOW: 'text-success', MEDIUM: 'text-warning', HIGH: 'text-danger' };
const STATUS_LABEL = { planned: 'Upcoming', active: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled' };

const TripDetailsScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const journey = useJourney();
  const details = useAsync(() => tripService.get(id), [id]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const trip = details.data?.trip;
  const route = trip?.selectedRoute;

  const mapProps = useMemo(() => {
    if (!trip) return null;
    const coords = route?.geometry?.coordinates || [
      [trip.from.longitude, trip.from.latitude],
      [trip.destination.longitude, trip.destination.latitude],
    ];
    return {
      routes: route?.geometry ? [{ id: 'trip', geometry: route.geometry, selected: true }] : [],
      markers: [
        { id: 'from', kind: 'origin', latitude: trip.from.latitude, longitude: trip.from.longitude, label: trip.from.name },
        { id: 'to', kind: 'destination', latitude: trip.destination.latitude, longitude: trip.destination.longitude, label: trip.destination.name },
      ],
      fit: boundsOf(coords),
    };
  }, [trip, route]);

  const handleStart = async () => {
    setError('');
    setStarting(true);
    try {
      await journey.startJourney(trip.id);
      navigate(ROUTES.LIVE_TRACKING);
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  if (details.loading && !trip) {
    return (
      <div className="w-full h-screen bg-surface flex items-center justify-center">
        <LoadingState label="Loading trip…" />
      </div>
    );
  }
  if (details.status === 'error') {
    return (
      <div className="w-full h-screen bg-surface flex flex-col items-center justify-center px-6">
        <ErrorState message={details.error.message} onRetry={details.reload} />
        <button onClick={() => navigate(ROUTES.MY_TRIPS)} className="text-primary text-[13px] font-bold mt-2">Back to My Trips</button>
      </div>
    );
  }

  const weather = details.data.weather;
  const alerts = details.data.alerts || [];
  const riskLevel = route?.riskLevel;

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-surface flex flex-col font-sans overflow-hidden">

      {/* Map Background (Top Half) */}
      <div className="absolute top-0 left-0 w-full h-[65%] z-0">
        <MapView
          zones={details.data.riskZones}
          routes={mapProps.routes}
          markers={mapProps.markers}
          fitBounds={mapProps.fit}
          fitKey={trip.id}
          padding={{ top: 60, bottom: 160, left: 40, right: 40 }}
          attributionPosition="topright"
          className="w-full h-full"
        />
        {/* Route Details Overlay on Map */}
        {trip.durationText && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-md z-10 whitespace-nowrap">
            {trip.durationText}
          </div>
        )}
      </div>

      {/* Bottom Sheet Card */}
      <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[24px] shadow-[0_-8px_20px_rgba(0,0,0,0.06)] z-20 flex flex-col h-[55%]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-[16px] font-bold text-text-primary">
            {LABELS.TRIP_DETAILS.TITLE}
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-full text-text-secondary hover:bg-black/5 active:scale-95 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">

          {/* Route Text */}
          <div className="mb-5">
            <h3 className="text-[18px] font-bold text-text-primary flex items-center gap-2 flex-wrap">
              {trip.from.name.split(',')[0]} <span className="text-text-secondary text-[14px]">→</span> {trip.destination.name.split(',')[0]}
            </h3>
            <p className="text-[12px] text-text-secondary mt-1">
              {formatDate(trip.travelDate)} &bull; {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'} &bull;{' '}
              <span className="font-bold text-primary">{STATUS_LABEL[trip.status]}</span>
              {trip.isDemo && <span className="ml-2 text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded">DEMO</span>}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {/* Distance */}
            <div className="bg-surface rounded-[12px] p-3 flex flex-col justify-center border border-border/50 shadow-sm">
              <span className="text-[11px] text-text-secondary mb-1">{LABELS.TRIP_DETAILS.DISTANCE}</span>
              <span className="text-[14px] font-bold text-text-primary">{trip.distanceText || '—'}</span>
            </div>

            {/* Duration */}
            <div className="bg-surface rounded-[12px] p-3 flex flex-col justify-center border border-border/50 shadow-sm">
              <span className="text-[11px] text-text-secondary mb-1">{LABELS.TRIP_DETAILS.DURATION}</span>
              <span className="text-[14px] font-bold text-text-primary">{trip.durationText || '—'}</span>
            </div>

            {/* Risk Level */}
            <div className="bg-surface rounded-[12px] p-3 flex flex-col justify-center border border-border/50 shadow-sm">
              <span className="text-[11px] text-text-secondary mb-1">{LABELS.TRIP_DETAILS.RISK_LEVEL}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {riskLevel === 'LOW' ? <ShieldCheck className="w-3.5 h-3.5 text-success" /> : <AlertTriangle className={clsx('w-3.5 h-3.5', RISK_TEXT[riskLevel] || 'text-text-secondary')} />}
                <span className={clsx('text-[14px] font-bold', RISK_TEXT[riskLevel] || 'text-text-secondary')}>
                  {riskLevel ? RISK_LABEL[riskLevel].replace(' Risk', '') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-surface rounded-[16px] p-4 border border-border/50 mb-4 shadow-sm">
            <h4 className="text-[12px] font-bold text-text-primary mb-1.5">
              {LABELS.TRIP_DETAILS.AI_RECOMMENDATION_TITLE}
              {Number.isFinite(trip.safetyScore) && <span className="ml-2 text-primary">Score {trip.safetyScore}/100</span>}
            </h4>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              {route?.recommendation || 'Route analysis is not available for this trip. Configure Mapbox to calculate routes.'}
            </p>
          </div>

          {/* Weather & timing */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-surface rounded-[16px] p-3 border border-border/50 shadow-sm">
              <p className="text-[11px] font-bold text-text-primary flex items-center gap-1.5 mb-1"><CloudSun className="w-3.5 h-3.5 text-warning" /> Destination weather</p>
              <p className="text-[11px] text-text-secondary leading-snug">{weather?.summary || 'Weather data is currently unavailable.'}</p>
            </div>
            <div className="bg-surface rounded-[16px] p-3 border border-border/50 shadow-sm">
              <p className="text-[11px] font-bold text-text-primary flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-primary" /> Journey time</p>
              <p className="text-[11px] text-text-secondary leading-snug">
                Start: {trip.startedAt ? formatDateTime(trip.startedAt) : 'Not started'}
                <br />
                End: {trip.endedAt ? formatDateTime(trip.endedAt) : '—'}
              </p>
            </div>
          </div>

          {trip.status === 'completed' && trip.summary && (
            <InlineNotice tone="info" className="mb-4">
              Travelled about {formatDistance(trip.summary.distanceTravelled)} · {trip.summary.locationPoints} location updates · {trip.summary.alertsCount} alerts
            </InlineNotice>
          )}

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-5">
              <h4 className="text-[12px] font-bold text-text-primary mb-2 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Trip alerts</h4>
              <div className="flex flex-col gap-2">
                {alerts.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-start gap-2 bg-background rounded-xl p-2.5 border border-border/60">
                    <AlertTriangle className={clsx('w-4 h-4 mt-0.5 shrink-0', a.severity === 'HIGH' || a.severity === 'CRITICAL' ? 'text-danger' : 'text-warning')} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-text-primary truncate">{a.title}</p>
                      <p className="text-[11px] text-text-secondary">{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <InlineNotice tone="danger" className="mb-4">{error}</InlineNotice>}

          {/* Start Journey Button */}
          {trip.status === 'planned' && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              isLoading={starting}
              disabled={journey.isActive}
              className="w-full py-4 rounded-[14px] text-[15px] font-bold shadow-lg shadow-primary/25"
            >
              {journey.isActive ? 'Another journey is active' : LABELS.TRIP_DETAILS.START_BUTTON}
            </Button>
          )}
          {trip.status === 'active' && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(ROUTES.LIVE_TRACKING)}
              className="w-full py-4 rounded-[14px] text-[15px] font-bold shadow-lg shadow-primary/25"
            >
              Open Live Tracking
            </Button>
          )}

        </div>
      </div>
    </div>
  );
};

export default TripDetailsScreen;
