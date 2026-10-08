import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Plus, MoreVertical } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import MapView from '../../../components/map/MapView';
import PlaceSuggestions, { usePlaceSearch } from '../../../components/common/PlaceSuggestions';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { useAsync } from '../../../hooks/useAsync';
import { adminService } from '../../../services/adminService';
import { RISK_LABEL, SOURCE_LABEL, boundsOf, formatDate } from '../../../utils/format';

const zoneStatus = (p) => {
  if (!p.active) return { label: 'Inactive', dot: 'bg-gray-400' };
  if (p.validUntil && new Date(p.validUntil) < new Date()) return { label: 'Expired', dot: 'bg-gray-400' };
  if (p.validFrom && new Date(p.validFrom) > new Date()) return { label: 'Scheduled', dot: 'bg-warning' };
  return { label: 'Active', dot: 'bg-green-500' };
};

const ZoneManagement = () => {
  const navigate = useNavigate();
  const zones = useAsync(() => adminService.zones(), []);
  const [filter, setFilter] = useState('ALL');
  const [menuFor, setMenuFor] = useState(null);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  const suggestions = usePlaceSearch(search, { enabled: searchFocused });

  const features = useMemo(() => zones.data?.features || [], [zones.data]);
  const filtered = useMemo(
    () =>
      features.filter((f) => {
        if (filter === 'ALL') return true;
        if (filter === 'INACTIVE') return !f.properties.active;
        return f.properties.riskLevel === filter;
      }),
    [features, filter]
  );
  const bounds = useMemo(() => boundsOf(features.map((f) => [f.properties.center.longitude, f.properties.center.latitude])), [features]);

  const act = async (fn) => {
    setMenuFor(null);
    setActionError('');
    try {
      await fn();
      await zones.reload();
    } catch (error) {
      setActionError(error.message);
    }
  };

  return (
    <div className="space-y-6" onClick={() => setMenuFor(null)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Zone Management</h1>
          <p className="text-text-secondary text-sm">Monitor and configure low, medium and high-risk zones</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/add-danger-zone')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Risk Zone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map */}
        <GlassCard className="lg:col-span-3 h-[400px] relative overflow-visible flex flex-col p-0 border-0">
          <div className="absolute inset-0 bg-[#E5E3DF] rounded-2xl overflow-hidden">
            <MapView
              zones={zones.data}
              fitBounds={bounds}
              fitKey={features.length}
              flyTo={flyTo}
              variant="light"
              zoomControl
              onMapClick={(pt) => navigate('/admin/add-danger-zone', { state: { latitude: pt.latitude, longitude: pt.longitude } })}
              className="absolute inset-0"
            />
          </div>

          {/* Map UI overlays */}
          <div className="absolute top-4 left-4 right-4 flex gap-2 z-10">
            <div className="flex-1 relative">
              <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search location to view zones… (click the map to add a zone there)"
                  className="bg-transparent border-none outline-none w-full text-sm font-medium"
                />
              </div>
              <PlaceSuggestions
                open={searchFocused && search.trim().length >= 3}
                results={suggestions.results}
                loading={suggestions.loading}
                error={suggestions.error}
                onSelect={(place) => {
                  setSearch(place.name);
                  setSearchFocused(false);
                  setFlyTo({ latitude: place.latitude, longitude: place.longitude, zoom: 13, key: Date.now() });
                }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Zones Table */}
        <GlassCard className="lg:col-span-3 overflow-visible">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-text-primary text-lg">Configured Zones</h3>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none font-medium"
              >
                <option value="ALL">All Zones</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          {actionError && <p className="px-6 pt-4 text-sm text-danger font-medium">{actionError}</p>}
          {zones.loading && !zones.data ? (
            <LoadingState label="Loading zones…" />
          ) : zones.status === 'error' ? (
            <ErrorState message={zones.error.message} onRetry={zones.reload} />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-text-secondary">No zones match this filter.</td>
                  </tr>
                )}
                {filtered.map((zone) => {
                  const p = zone.properties;
                  const status = zoneStatus(p);
                  return (
                  <tr key={zone.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="flex items-center gap-3 text-left"
                        onClick={() => setFlyTo({ latitude: p.center.latitude, longitude: p.center.longitude, zoom: 14, key: Date.now() })}
                      >
                        <div className={`p-2 rounded-lg ${p.riskLevel === 'LOW' ? 'bg-success/10 text-success' : p.riskLevel === 'MEDIUM' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span>
                          <span className="block text-sm font-semibold text-text-primary">{p.name}</span>
                          <span className="block text-[11px] text-text-secondary">Updated {formatDate(p.updatedAt)}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.riskLevel === 'LOW' ? 'bg-success/10 text-success' :
                        p.riskLevel === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                        'bg-danger/10 text-danger'
                      }`}>
                        {RISK_LABEL[p.riskLevel]}
                        {p.activeHours !== 'ALWAYS' && ` · ${p.activeHours === 'NIGHT' ? 'Night' : 'Day'}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-medium">
                      <span className={p.sourceType === 'DEMO' ? 'text-warning font-bold' : ''}>{SOURCE_LABEL[p.sourceType]}</span>
                      <span className="block text-[11px]">{p.sourceName} · {Math.round(p.confidence * 100)}% confidence</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary">
                        <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFor(menuFor === zone.id ? null : zone.id);
                        }}
                        className="text-gray-400 hover:text-primary transition-colors p-1"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {menuFor === zone.id && (
                        <div className="absolute right-6 top-12 z-30 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-44 text-left" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => navigate(`/admin/danger-zones/${zone.id}/edit`)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                            Edit
                          </button>
                          <button
                            onClick={() => act(() => (p.active ? adminService.disableZone(zone.id) : adminService.updateZone(zone.id, { active: true })))}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            {p.active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => window.confirm(`Permanently delete "${p.name}"?`) && act(() => adminService.deleteZone(zone.id))}
                            className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-gray-50"
                          >
                            Delete permanently
                          </button>
                        </div>
                      )}
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
    </div>
  );
};

export default ZoneManagement;
