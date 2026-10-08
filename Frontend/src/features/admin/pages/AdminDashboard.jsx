import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, MapPin, Navigation, ShieldCheck, Bell, Activity, Map, BrainCircuit, Eye, ShieldAlert, Clock, AlertOctagon
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import MapView from '../../../components/map/MapView';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { useAsync } from '../../../hooks/useAsync';
import { adminService } from '../../../services/adminService';
import { riskService } from '../../../services/riskService';
import { useSocketEvent } from '../../../context/NotificationContext';
import { boundsOf, timeAgo } from '../../../utils/format';

// trendUp = direction of change; risingIsGood decides whether that direction is shown green or red.
const StatCard = ({ title, value, icon: Icon, trend, trendUp, risingIsGood = true, type }) => (
  <GlassCard className="p-5">
    <div className="flex justify-between items-start mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        type === 'danger' ? 'bg-danger/10 text-danger' :
        type === 'warning' ? 'bg-warning/10 text-warning' :
        type === 'success' ? 'bg-success/10 text-success' :
        'bg-primary/10 text-primary'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div title="Last 7 days vs previous 7 days" className={`px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
        trendUp === risingIsGood ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
      }`}>
        {trendUp ? '↑' : '↓'} {trend}
      </div>
    </div>
    <h3 className="text-text-secondary text-xs font-medium mb-1">{title}</h3>
    <h2 className="text-text-primary text-2xl font-bold">{Number(value).toLocaleString()}</h2>
  </GlassCard>
);

const alertLocation = (alert) =>
  alert.riskZone?.name || alert.meta?.address || (Number.isFinite(alert.latitude) ? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}` : '—');

const AdminDashboard = () => {
  const navigate = useNavigate();
  const stats = useAsync(() => adminService.stats(), []);
  const zones = useAsync(() => riskService.list(), []);
  const reloadTimer = useRef(null);

  // Refresh live numbers when relevant real-time events arrive (debounced).
  const scheduleReload = () => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => stats.reload(), 1500);
  };
  useEffect(() => () => clearTimeout(reloadTimer.current), []);
  useSocketEvent('sos:triggered', scheduleReload);
  useSocketEvent('sos:updated', scheduleReload);
  useSocketEvent('journey:start', scheduleReload);
  useSocketEvent('journey:end', scheduleReload);
  useSocketEvent('journey:risk-alert', scheduleReload);
  useSocketEvent('admin:zone-updated', () => {
    scheduleReload();
    zones.reload();
  });

  if (stats.loading && !stats.data) return <LoadingState label="Loading dashboard…" />;
  if (stats.status === 'error') return <ErrorState message={stats.error.message} onRetry={stats.reload} />;

  const d = stats.data;
  const t = d.totals;
  const zoneFeatures = zones.data?.features || [];
  const zoneBounds = boundsOf(zoneFeatures.map((f) => [f.properties.center.longitude, f.properties.center.latitude]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Safety Monitoring Hub</h1>
        <p className="text-text-secondary text-sm mt-1">Real-time overview of network safety and active operations.</p>
      </div>

      {/* 1. Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={t.users.value} icon={Users} trend={t.users.trend.value} trendUp={t.users.trend.up} />
        <StatCard title="Active Trips" value={t.activeTrips.value} icon={Navigation} trend={t.activeTrips.trend.value} trendUp={t.activeTrips.trend.up} />
        <StatCard title="Danger Zones" value={t.dangerZones.value} icon={AlertOctagon} trend={t.dangerZones.trend.value} trendUp={t.dangerZones.trend.up} risingIsGood={false} type="danger" />
        <StatCard title="Low-Risk Zones" value={t.lowRiskZones.value} icon={ShieldCheck} trend={t.lowRiskZones.trend.value} trendUp={t.lowRiskZones.trend.up} type="success" />
        <StatCard title="Emergency Alerts" value={t.emergencyAlerts.value} icon={Bell} trend={t.emergencyAlerts.trend.value} trendUp={t.emergencyAlerts.trend.up} risingIsGood={false} type="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Emergency Monitoring Section */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col border-l-4 border-l-danger">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <ShieldAlert className="text-danger w-5 h-5" />
              Live Emergency Alerts
            </h3>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${d.emergency.activeSos ? 'bg-danger/10 text-danger animate-pulse' : 'bg-success/10 text-success'}`}>
              {d.emergency.activeSos} ACTIVE SOS
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-danger/5 rounded-xl p-4 text-center">
              <h4 className="text-2xl font-bold text-danger mb-1">{d.emergency.sosToday}</h4>
              <p className="text-xs text-text-secondary font-medium uppercase">SOS Today</p>
            </div>
            <div className="bg-warning/5 rounded-xl p-4 text-center">
              <h4 className="text-2xl font-bold text-warning mb-1">{d.emergency.riskWarningsToday}</h4>
              <p className="text-xs text-text-secondary font-medium uppercase">Risk Warnings</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <h4 className="text-2xl font-bold text-primary mb-1">{d.emergency.resolvedToday}</h4>
              <p className="text-xs text-text-secondary font-medium uppercase">Resolved Today</p>
            </div>
          </div>

          <div className="space-y-3">
            {d.recentAlerts.length === 0 && <p className="text-sm text-text-secondary">No alerts yet.</p>}
            {d.recentAlerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => navigate(alert.type === 'SOS' ? '/admin/alerts/sos' : '/admin/alerts/live')}
                className="w-full flex items-center justify-between bg-white/40 p-3 rounded-lg text-left hover:bg-white/70 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${alert.type === 'SOS' ? 'bg-danger' : 'bg-warning'}`}></div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {alert.title}{alert.user ? ` — ${alert.user.name}` : ''}
                      {alert.type === 'SOS' && alert.status !== 'active' && <span className="ml-2 text-[10px] text-success uppercase">{alert.status}</span>}
                    </p>
                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {alertLocation(alert)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 shrink-0 ml-2">{timeAgo(alert.createdAt)}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* 3. Live Trip Monitoring Section */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-6">
              <Activity className="text-primary w-5 h-5" />
              Live Trip Monitoring
            </h3>

            <div className="space-y-5 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-text-secondary">Active Travelers</span>
                <span className="text-lg font-bold text-text-primary">{d.liveMonitoring.activeTravelers}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-text-secondary">Monitored Trips</span>
                <span className="text-lg font-bold text-text-primary">{d.liveMonitoring.monitoredTrips}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-text-secondary">Users Online</span>
                <span className="text-lg font-bold text-text-primary">{d.liveMonitoring.connectedUsers}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-text-secondary">Overall Risk Status</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-md ${d.liveMonitoring.overallRisk === 'Low / Stable' ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                  {d.liveMonitoring.overallRisk}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/tracking/live')}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
          >
            <Map className="w-4 h-4" /> View Live Map
          </button>
        </GlassCard>

        {/* 4. Risk Heatmap Preview */}
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden relative min-h-[300px]">
          <div className="absolute inset-0">
            <MapView
              zones={zones.data}
              fitBounds={zoneBounds}
              fitKey={zoneFeatures.length}
              variant="light"
              zoomControl
              className="absolute inset-0"
            />
          </div>
          <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl w-fit">
              <MapPin className="text-text-primary w-5 h-5" />
              Risk Zones Overview
            </h3>

            <div className="mt-4 inline-block bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-white">
              <p className="text-xs font-bold text-text-secondary uppercase mb-2">Risk Levels</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-danger"></div>
                  <span className="text-sm text-text-primary font-medium">High Risk (Red)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span className="text-sm text-text-primary font-medium">Medium Risk (Orange)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-sm text-text-primary font-medium">Low Risk (Green)</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 5. AI Safety Insights Card */}
        <GlassCard className="p-6 border-t-4 border-t-primary">
           <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-6">
            <BrainCircuit className="text-primary w-5 h-5" />
            Safety Insights
          </h3>

          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-xl">
              <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Most Risky Time (30 days)</p>
              <p className="text-sm font-bold text-text-primary">{d.insights.mostRiskyTime || 'Not enough alert data yet'}</p>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl">
              <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Most Alerted Zone (30 days)</p>
              <p className="text-sm font-bold text-text-primary">{d.insights.mostReportedZone || 'Not enough alert data yet'}</p>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl">
              <p className="text-xs text-text-secondary uppercase font-semibold mb-1">AI Prediction</p>
              <p className="text-sm font-medium text-text-primary">
                {d.insights.prediction || 'No verified prediction data is available. Predictions are not generated without a trusted data source.'}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* 6. Recent Activity Timeline */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-text-secondary" />
            Safety Timeline
          </h3>
          <div className="space-y-6">
            {d.timeline.length === 0 && <p className="text-sm text-text-secondary">No activity yet.</p>}
            {d.timeline.map((activity, i) => (
              <div key={`${activity.title}-${activity.time}`} className="flex gap-4 relative">
                {i !== d.timeline.length - 1 && <div className="absolute left-2.5 top-6 w-[1px] h-10 bg-gray-200"></div>}
                <div className={`w-5 h-5 rounded-full mt-0.5 shrink-0 border-2 border-white shadow-sm ${
                  activity.type === 'critical' ? 'bg-danger' :
                  activity.type === 'warning' ? 'bg-warning' :
                  activity.type === 'success' ? 'bg-success' : 'bg-primary'
                }`}></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{activity.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{activity.detail}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(activity.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 7. Quick Actions Panel */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/admin/danger-zones/add', { state: { riskLevel: 'HIGH' } })} className="flex flex-col items-center justify-center p-4 bg-white/50 hover:bg-danger/10 border border-gray-100 rounded-xl transition group text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center group-hover:scale-110 transition">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">Add Danger Zone</span>
            </button>
            <button onClick={() => navigate('/admin/danger-zones/add', { state: { riskLevel: 'LOW' } })} className="flex flex-col items-center justify-center p-4 bg-white/50 hover:bg-success/10 border border-gray-100 rounded-xl transition group text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">Add Low-Risk Zone</span>
            </button>
            <button onClick={() => navigate('/admin/reports')} className="flex flex-col items-center justify-center p-4 bg-white/50 hover:bg-primary/10 border border-gray-100 rounded-xl transition group text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">View Reports</span>
            </button>
            <button onClick={() => navigate('/admin/notifications/send')} className="flex flex-col items-center justify-center p-4 bg-white/50 hover:bg-warning/10 border border-gray-100 rounded-xl transition group text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center group-hover:scale-110 transition">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">Send Alert</span>
            </button>
          </div>
        </GlassCard>

        {/* 8. Zone Statistics */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Zone Analytics</h3>
          <div className="space-y-4">
            {[
              { label: 'High Risk Zones', pct: d.zoneAnalytics.high, color: 'bg-danger', text: 'text-danger' },
              { label: 'Medium Risk Zones', pct: d.zoneAnalytics.medium, color: 'bg-warning', text: 'text-warning' },
              { label: 'Low Risk Zones', pct: d.zoneAnalytics.low, color: 'bg-success', text: 'text-success' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-text-primary">{row.label}</span>
                  <span className={row.text}>{row.pct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${row.color}`} style={{ width: `${row.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
             <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-secondary">Recently Updated</span>
              <span className="text-sm font-bold text-text-primary">{d.zoneAnalytics.updatedToday} Zones (Today)</span>
             </div>
             <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-text-secondary">Active zones</span>
              <span className="text-sm font-bold text-text-primary">{d.zoneAnalytics.total}</span>
             </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default AdminDashboard;
