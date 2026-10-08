import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, AlertOctagon, CheckCircle, Clock, X, MapPin } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import MapView from '../../../components/map/MapView';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { useAsync } from '../../../hooks/useAsync';
import { adminService } from '../../../services/adminService';
import { useSocketEvent } from '../../../context/NotificationContext';
import { formatDateTime, timeAgo } from '../../../utils/format';

const TYPE_LABEL = {
  SOS: 'SOS Alert',
  RISK_ZONE: 'Risk Zone Entry',
  ROUTE_DEVIATION: 'Route Deviation',
  WEATHER: 'Weather Warning',
  ADMIN: 'Admin Alert',
  TRIP: 'Trip',
};
const FILTERS = [{ id: '', label: 'All types' }, ...Object.entries(TYPE_LABEL).map(([id, label]) => ({ id, label }))];

const defaultTypeForPath = (path) => (path.includes('/sos') ? 'SOS' : path.includes('/map/reports') ? 'RISK_ZONE' : '');

const ReportsManagement = () => {
  const location = useLocation();
  const [type, setType] = useState(defaultTypeForPath(location.pathname));
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [actionError, setActionError] = useState('');
  const alerts = useAsync(() => adminService.alerts({ type: type || undefined, limit: 100 }), [type]);

  useSocketEvent('sos:triggered', () => alerts.reload());
  useSocketEvent('sos:updated', () => alerts.reload());
  useSocketEvent('journey:risk-alert', () => alerts.reload());

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = alerts.data?.alerts || [];
    if (!q) return list;
    return list.filter((a) => [a.title, a.message, a.user?.name, a.user?.email, a.riskZone?.name, a.meta?.address].some((v) => v?.toLowerCase().includes(q)));
  }, [alerts.data, search]);
  const counts = alerts.data?.counts || { activeSos: 0, pending: 0, resolvedToday: 0 };

  const resolve = async (alert) => {
    setResolving(true);
    setActionError('');
    try {
      const updated = await adminService.resolveAlert(alert.id);
      setSelected((s) => (s ? { ...s, ...updated } : s));
      await alerts.reload();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setResolving(false);
    }
  };

  const statusPill = (a) =>
    a.status === 'active'
      ? { label: a.type === 'SOS' ? 'Active' : 'Open', cls: 'bg-danger/10 text-danger' }
      : a.status === 'resolved'
        ? { label: 'Resolved', cls: 'bg-success/10 text-success' }
        : { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports & SOS</h1>
          <p className="text-text-secondary text-sm">Manage SOS events and safety alerts raised during journeys</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`p-2 bg-white border rounded-xl transition-colors shadow-sm ${type ? 'text-primary border-primary/50' : 'text-gray-500 border-gray-200 hover:text-primary hover:border-primary/50'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-11 z-30 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48">
                {FILTERS.map((f) => (
                  <button
                    key={f.id || 'all'}
                    onClick={() => {
                      setType(f.id);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${type === f.id ? 'text-primary font-bold' : ''}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-5 border-l-4 border-l-danger">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-text-secondary mb-1">Active SOS Alerts</p>
              <p className="text-3xl font-bold text-text-primary">{counts.activeSos}</p>
            </div>
            <div className="p-3 bg-danger/10 rounded-full text-danger">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 border-l-4 border-l-warning">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-text-secondary mb-1">Open High-Severity</p>
              <p className="text-3xl font-bold text-text-primary">{counts.pending}</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-full text-warning">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 border-l-4 border-l-success">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-text-secondary mb-1">Resolved Today</p>
              <p className="text-3xl font-bold text-text-primary">{counts.resolvedToday}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-full text-success">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        {alerts.loading && !alerts.data ? (
          <LoadingState label="Loading reports…" />
        ) : alerts.status === 'error' ? (
          <ErrorState message={alerts.error.message} onRetry={alerts.reload} />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type & Severity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-text-secondary">No reports found.</td>
                </tr>
              )}
              {rows.map((report) => {
                const pill = statusPill(report);
                return (
                <tr key={report.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-primary">#{report.id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-text-primary">{TYPE_LABEL[report.type] || report.type}</div>
                    <div className={`text-[11px] font-bold mt-1 uppercase ${
                      report.severity === 'CRITICAL' ? 'text-danger' :
                      report.severity === 'HIGH' ? 'text-orange-500' :
                      report.severity === 'MEDIUM' ? 'text-warning' : 'text-success'
                    }`}>{report.severity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-secondary">
                    {report.user?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-primary max-w-[240px] truncate">
                      {report.riskZone?.name || report.meta?.address || (Number.isFinite(report.latitude) ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}` : 'N/A')}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{timeAgo(report.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${pill.cls}`}>
                      {pill.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setActionError('');
                        setSelected(report);
                      }}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-text-primary shadow-sm hover:border-primary hover:text-primary transition-all"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </GlassCard>

      {/* Details drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-primary">#{selected.id.slice(-6).toUpperCase()}</p>
                <h2 className="text-lg font-bold text-text-primary">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {Number.isFinite(selected.latitude) && (
              <div className="h-56 relative">
                <MapView
                  center={{ latitude: selected.latitude, longitude: selected.longitude }}
                  zoom={15}
                  zoomControl
                  markers={[{ id: 'loc', kind: selected.type === 'SOS' ? 'sos' : 'destination', latitude: selected.latitude, longitude: selected.longitude }]}
                  className="absolute inset-0"
                />
              </div>
            )}
            <div className="p-6 space-y-4 text-sm">
              <p className="text-text-secondary">{selected.message}</p>
              <dl className="grid grid-cols-3 gap-y-3">
                <dt className="text-text-secondary">User</dt>
                <dd className="col-span-2 font-semibold">{selected.user?.name || '—'} <span className="block text-xs text-text-secondary font-normal">{selected.user?.phone || ''} {selected.user?.email || ''}</span></dd>
                <dt className="text-text-secondary">Severity</dt>
                <dd className="col-span-2 font-semibold">{selected.severity}</dd>
                <dt className="text-text-secondary">Time</dt>
                <dd className="col-span-2 font-semibold">{formatDateTime(selected.createdAt)}</dd>
                <dt className="text-text-secondary">Location</dt>
                <dd className="col-span-2 font-semibold">
                  {selected.meta?.address || (Number.isFinite(selected.latitude) ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}` : '—')}
                  {Number.isFinite(selected.latitude) && (
                    <a
                      className="flex items-center gap-1 text-primary text-xs mt-1"
                      href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPin className="w-3 h-3" /> Open in Google Maps
                    </a>
                  )}
                </dd>
                {selected.type === 'SOS' && (
                  <>
                    <dt className="text-text-secondary">Contacts</dt>
                    <dd className="col-span-2">
                      {(selected.meta?.contacts || []).length === 0
                        ? 'No emergency contacts on file'
                        : selected.meta.contacts.map((c) => (
                            <span key={c.phone} className="block">
                              {c.name} ({c.relationship || 'contact'}): <a href={`tel:${c.phone}`} className="text-primary font-semibold">{c.phone}</a>
                            </span>
                          ))}
                      {!selected.meta?.smsConfigured && <span className="block text-xs text-warning mt-1">SMS provider not configured — contacts were not messaged automatically.</span>}
                    </dd>
                  </>
                )}
                <dt className="text-text-secondary">Status</dt>
                <dd className="col-span-2 font-semibold capitalize">{selected.status}{selected.resolvedAt ? ` (${timeAgo(selected.resolvedAt)})` : ''}</dd>
              </dl>
              {actionError && <p className="text-danger font-medium">{actionError}</p>}
              {selected.status === 'active' && (
                <button
                  onClick={() => resolve(selected)}
                  disabled={resolving}
                  className="w-full py-3 bg-success text-white rounded-xl font-semibold shadow-md hover:bg-success/90 disabled:opacity-60"
                >
                  {resolving ? 'Resolving…' : 'Mark as Resolved'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
