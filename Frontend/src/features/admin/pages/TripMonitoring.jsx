import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navigation, Radio } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import MapView from '../../../components/map/MapView';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { useAsync } from '../../../hooks/useAsync';
import { adminService } from '../../../services/adminService';
import { trackingService } from '../../../services/trackingService';
import { useSocketEvent } from '../../../context/NotificationContext';
import { RISK_LABEL, boundsOf, formatDate, timeAgo } from '../../../utils/format';

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'planned', label: 'Planned' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: '', label: 'All' },
];

const statusForPath = (path) => (path.includes('completed') ? 'completed' : path.includes('history') ? '' : 'active');
const RISK_TEXT = { LOW: 'text-success', MEDIUM: 'text-warning', HIGH: 'text-danger' };

const TripMonitoring = () => {
  const location = useLocation();
  const [status, setStatus] = useState(statusForPath(location.pathname));
  const [positions, setPositions] = useState({});
  const [focus, setFocus] = useState(null);
  const trips = useAsync(() => adminService.trips({ status: status || undefined, limit: 100 }), [status]);

  // Seed last-known positions for active trips, then keep them live via Socket.IO.
  useEffect(() => {
    const active = (trips.data || []).filter((t) => t.status === 'active').slice(0, 20);
    active.forEach((t) =>
      trackingService
        .history(t.id)
        .then((data) => {
          const last = data.points[data.points.length - 1];
          if (last) setPositions((p) => (p[t.id] ? p : { ...p, [t.id]: { ...last, user: t.user } }));
        })
        .catch(() => {})
    );
  }, [trips.data]);

  useSocketEvent('journey:location', (update) => {
    setPositions((p) => ({ ...p, [update.tripId]: { ...update, timestamp: update.timestamp } }));
  });
  useSocketEvent('journey:start', () => trips.reload());
  useSocketEvent('journey:end', (trip) => {
    setPositions((p) => {
      const next = { ...p };
      delete next[trip.id];
      return next;
    });
    trips.reload();
  });

  const list = useMemo(() => trips.data || [], [trips.data]);
  const markers = useMemo(
    () =>
      Object.entries(positions).map(([tripId, pos]) => ({
        id: tripId,
        kind: pos.riskLevel === 'HIGH' ? 'sos' : 'user',
        latitude: pos.latitude,
        longitude: pos.longitude,
        label: `${pos.user?.name || 'Traveller'} · ${timeAgo(pos.timestamp)}`,
      })),
    [positions]
  );
  const routes = useMemo(
    () => list.filter((t) => t.selectedRoute?.geometry).map((t) => ({ id: t.id, geometry: t.selectedRoute.geometry, selected: t.id === focus })),
    [list, focus]
  );
  const bounds = useMemo(() => {
    const pts = [...markers.map((m) => [m.longitude, m.latitude]), ...list.flatMap((t) => [[t.from.longitude, t.from.latitude], [t.destination.longitude, t.destination.latitude]])];
    return boundsOf(pts);
  }, [markers, list]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Trip Monitoring</h1>
          <p className="text-text-secondary text-sm">Journeys and live positions (only visible to admins)</p>
        </div>
        <div className="flex bg-white/60 border border-gray-200 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id || 'all'}
              onClick={() => setStatus(tab.id)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${status === tab.id ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="h-[420px] relative p-0 border-0">
        <MapView
          routes={routes}
          markers={markers}
          fitBounds={bounds}
          fitKey={`${status}-${list.length}`}
          variant="light"
              zoomControl
          onRouteClick={setFocus}
          className="absolute inset-0"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50 flex items-center gap-2 text-sm font-semibold">
          <Radio className="w-4 h-4 text-success animate-pulse" /> {markers.length} live position{markers.length === 1 ? '' : 's'}
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {trips.loading && !trips.data ? (
          <LoadingState label="Loading trips…" />
        ) : trips.status === 'error' ? (
          <ErrorState message={trips.error.message} onRetry={trips.reload} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {['Traveller', 'Route', 'Date', 'Safety', 'Status', 'Last update'].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-text-secondary">No trips in this category.</td>
                  </tr>
                )}
                {list.map((trip) => {
                  const pos = positions[trip.id];
                  return (
                    <tr key={trip.id} onClick={() => setFocus(trip.id)} className={`cursor-pointer transition-colors ${focus === trip.id ? 'bg-primary/5' : 'hover:bg-gray-50/30'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-text-primary">{trip.user?.name || '—'}</div>
                        <div className="text-xs text-text-secondary">{trip.user?.phone || trip.user?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-text-primary max-w-[280px] truncate">
                          {trip.from.name.split(',')[0]} → {trip.destination.name.split(',')[0]}
                        </div>
                        <div className="text-xs text-text-secondary">{trip.distanceText || '—'} · {trip.durationText || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(trip.travelDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${RISK_TEXT[trip.riskLevel] || 'text-text-secondary'}`}>
                          {Number.isFinite(trip.safetyScore) ? `${trip.safetyScore}/100` : '—'}
                        </span>
                        {pos?.riskLevel && <div className={`text-[11px] font-bold ${RISK_TEXT[pos.riskLevel]}`}>Now: {RISK_LABEL[pos.riskLevel]}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${trip.status === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
                          {trip.status === 'active' && <Navigation className="w-3 h-3" />} {trip.status}
                        </span>
                        {trip.isDemo && <span className="ml-1 text-[10px] font-bold text-warning">DEMO</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-text-secondary">
                        {pos ? timeAgo(pos.timestamp) : trip.status === 'active' ? 'Waiting for GPS' : timeAgo(trip.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default TripMonitoring;
