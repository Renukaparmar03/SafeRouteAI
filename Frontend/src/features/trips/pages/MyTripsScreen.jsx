import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, SlidersHorizontal, MapPin,
  Calendar, Users, Car, Clock, MoreVertical,
  ShieldCheck, Route, FileText, Navigation, ArrowRight,
  Luggage
} from 'lucide-react';
import { clsx } from 'clsx';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import Button from '../../../components/ui/Button';
import { ErrorState, InlineNotice, LoadingState } from '../../../components/common/StateViews';
import { TRAVEL_MODE_LABEL, TRIP_TABS } from '../../../constants/tripOptions';
import { ROUTES } from '../../../constants/routes';
import { useAsync } from '../../../hooks/useAsync';
import { tripService } from '../../../services/tripService';
import { useJourney } from '../../../context/JourneyContext';
import MapView from '../../../components/map/MapView';
import { boundsOf, formatDate } from '../../../utils/format';

/** Tiny, non-interactive map preview of a trip's start and end points. */
const TripThumbnail = ({ trip }) => {
  const points = [
    [trip.from.longitude, trip.from.latitude],
    [trip.destination.longitude, trip.destination.latitude],
  ];
  return (
    <MapView
      interactive={false}
      markers={[
        { id: 'a', kind: 'origin', latitude: trip.from.latitude, longitude: trip.from.longitude },
        { id: 'b', kind: 'user', latitude: trip.destination.latitude, longitude: trip.destination.longitude },
      ]}
      fitBounds={boundsOf(points)}
      fitKey={trip.id}
      padding={18}
      attributionText="&copy; OpenStreetMap"
      className="absolute inset-0 map-thumbnail"
    />
  );
};

const isLowRisk = (trip) => trip.riskLevel === 'LOW' || (trip.riskLevel == null && (trip.safetyScore ?? 0) >= 75);

const insightsFor = (trip) => {
  const factors = trip.selectedRoute?.factors || [];
  const negatives = factors.filter((f) => f.kind === 'negative').map((f) => f.label);
  const positives = factors.filter((f) => f.kind === 'positive').map((f) => f.label);
  const list = [...negatives, ...positives].slice(0, 2);
  if (trip.status === 'completed' && trip.summary) {
    return [`${trip.summary.alertsCount ?? 0} alert${trip.summary.alertsCount === 1 ? '' : 's'} during trip`, ...list].slice(0, 2);
  }
  return list.length ? list : [trip.weatherSummary || 'Route analysis not available'];
};

const MyTripsScreen = () => {
  const navigate = useNavigate();
  const journey = useJourney();
  const [activeTab, setActiveTab] = useState('planned');
  const [newestFirst, setNewestFirst] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const trips = useAsync(() => tripService.list(), []);

  const filteredTrips = useMemo(() => {
    const list = (trips.data || []).filter(trip => trip.status === activeTab);
    return list.sort((a, b) => (newestFirst ? -1 : 1) * (new Date(a.travelDate) - new Date(b.travelDate)));
  }, [trips.data, activeTab, newestFirst]);

  const handleStart = async (trip) => {
    setActionError('');
    setBusyId(trip.id);
    try {
      await journey.startJourney(trip.id);
      navigate(ROUTES.LIVE_TRACKING);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (trip) => {
    setMenuFor(null);
    setActionError('');
    try {
      const updated = await tripService.update(trip.id, { status: 'cancelled' });
      trips.setData((list) => list.map((t) => (t.id === trip.id ? { ...t, status: updated.status } : t)));
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleDelete = async (trip) => {
    setMenuFor(null);
    setActionError('');
    if (!window.confirm(`Delete the trip to ${trip.destination.name}? This cannot be undone.`)) return;
    try {
      await tripService.remove(trip.id);
      trips.setData((list) => list.filter((t) => t.id !== trip.id));
    } catch (error) {
      setActionError(error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden font-sans">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-surface z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold text-text-primary tracking-wide">
          My Trips
        </h1>
        <button
          onClick={() => setNewestFirst((v) => !v)}
          title={newestFirst ? 'Showing latest date first' : 'Showing earliest date first'}
          className="p-2 -mr-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface px-2 border-b border-border shadow-sm z-10">
        {TRIP_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors relative",
                isActive ? "text-primary" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-[100px] scrollbar-hide" onClick={() => setMenuFor(null)}>
        {actionError && <InlineNotice tone="danger" className="mb-4">{actionError}</InlineNotice>}

        {trips.loading && !trips.data ? (
          <LoadingState label="Loading your trips…" />
        ) : trips.status === 'error' ? (
          <ErrorState message={trips.error.message} onRetry={trips.reload} />
        ) : filteredTrips.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredTrips.map((trip) => {
              const low = isLowRisk(trip);
              return (
              <div key={trip.id} className="bg-surface rounded-2xl p-4 shadow-sm border border-border">

                <div className="flex gap-4">
                  {/* Left: Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0 bg-primary/5 flex items-center justify-center">
                    <TripThumbnail trip={trip} />
                    <div className="absolute top-2 left-2 z-[500] bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-bold text-text-primary">{trip.durationText || '—'}</span>
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 text-text-primary font-bold text-[14px] truncate">
                        <span className="truncate">{trip.from.name.split(',')[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                        <span className="truncate">{trip.destination.name.split(',')[0]}</span>
                      </div>
                      {trip.status !== 'active' && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuFor(menuFor === trip.id ? null : trip.id);
                            }}
                            className="p-1 -mr-2 text-text-secondary"
                            aria-label="Trip options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuFor === trip.id && (
                            <div className="absolute right-0 top-6 z-30 bg-surface rounded-xl shadow-lg border border-border py-1 w-32" onClick={(e) => e.stopPropagation()}>
                              {trip.status === 'planned' && (
                                <button onClick={() => handleCancel(trip)} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-text-primary hover:bg-background">
                                  Cancel trip
                                </button>
                              )}
                              <button onClick={() => handleDelete(trip)} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-danger hover:bg-background">
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-1">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{formatDate(trip.travelDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Car className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{TRAVEL_MODE_LABEL[trip.travelMode] || trip.travelMode}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{trip.distanceText || '—'}</span>
                      </div>
                    </div>
                    {trip.isDemo && <span className="inline-block mt-2 text-[9px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded">DEMO</span>}
                  </div>
                </div>

                {/* Risk / Insights Badge */}
                {trip.status !== 'cancelled' && (
                  <div className={clsx(
                    "mt-4 rounded-xl p-3 flex items-start gap-3 border",
                    low ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
                  )}>
                    <div className="flex flex-col items-center justify-center min-w-[50px]">
                      <ShieldCheck className={clsx(
                        "w-5 h-5 mb-0.5",
                        low ? "text-success" : "text-warning"
                      )} />
                      <span className={clsx(
                        "text-[10px] font-bold",
                        low ? "text-success" : "text-warning"
                      )}>{Number.isFinite(trip.safetyScore) ? `${trip.safetyScore}/100` : '—'}</span>
                    </div>
                    <div className="border-l border-black/10 pl-3">
                      <ul className="flex flex-col gap-1">
                        {insightsFor(trip).map((insight) => (
                          <li key={insight} className="text-[10px] text-text-secondary font-medium flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-text-secondary opacity-50 shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`${ROUTES.TRIP_DETAILS}/${trip.id}`)}
                    className="flex-1 py-2 text-[12px] rounded-lg border-border/80 text-text-secondary hover:text-text-primary"
                  >
                    View Details
                  </Button>

                  {activeTab === 'planned' && (
                    <Button
                      variant="primary"
                      onClick={() => handleStart(trip)}
                      isLoading={busyId === trip.id}
                      disabled={Boolean(busyId) || journey.isActive}
                      className="flex-1 py-2 text-[12px] rounded-lg gap-1.5"
                    >
                      {busyId !== trip.id && <Navigation className="w-3.5 h-3.5" />} Start Journey
                    </Button>
                  )}
                  {activeTab === 'active' && (
                    <Button
                      variant="primary"
                      onClick={() => navigate(ROUTES.LIVE_TRACKING)}
                      className="flex-1 py-2 text-[12px] rounded-lg gap-1.5"
                    >
                      <Route className="w-3.5 h-3.5" /> Continue
                    </Button>
                  )}
                  {activeTab === 'completed' && (
                    <Button
                      variant="primary"
                      onClick={() => navigate(`${ROUTES.TRIP_DETAILS}/${trip.id}`)}
                      className="flex-1 py-2 text-[12px] rounded-lg gap-1.5 bg-text-primary hover:bg-text-primary/90 text-white shadow-none"
                    >
                      <FileText className="w-3.5 h-3.5" /> Summary
                    </Button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 pb-10 px-4 text-center">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-5 border border-primary/10">
              <Luggage className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-[16px] font-bold text-text-primary mb-2">
              {trips.data?.length ? 'No trips in this category' : "You don't have any trips yet."}
            </h3>
            <p className="text-[12px] text-text-secondary font-medium mb-6 max-w-[220px]">
              Plan your next trip with SafeRoute AI to get smart routes and real-time safety updates.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.TRIP_PLANNER)}
              className="py-3 px-8 rounded-xl text-[13px] shadow-lg shadow-primary/20"
            >
              Plan a Trip
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

export default MyTripsScreen;
