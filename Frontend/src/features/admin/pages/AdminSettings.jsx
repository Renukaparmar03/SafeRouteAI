import React from 'react';
import { CheckCircle, Database, Settings, XCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { useAsync } from '../../../hooks/useAsync';
import { adminService } from '../../../services/adminService';
import { isFirebaseConfigured } from '../../../services/pushService';

const SERVICES = [
  { id: 'maps', name: 'Maps: OpenStreetMap (Photon search, OSRM routes, Overpass places)', env: 'no key required' },
  { id: 'mapbox', name: 'Mapbox (optional upgrade for search / routes)', env: 'MAPBOX_ACCESS_TOKEN' },
  { id: 'gemini', name: 'Google Gemini (AI assistant)', env: 'GEMINI_API_KEY' },
  { id: 'firebase', name: 'Firebase Cloud Messaging (push)', env: 'FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY' },
  { id: 'openMeteo', name: 'Open-Meteo (weather)', env: 'no key required' },
  { id: 'sms', name: 'SMS provider (SOS contacts)', env: 'not integrated' },
];

const Row = ({ ok, name, hint }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <div>
      <p className="text-sm font-semibold text-text-primary">{name}</p>
      <p className="text-xs text-text-secondary font-mono">{hint}</p>
    </div>
    <span className={`flex items-center gap-1.5 text-sm font-bold ${ok ? 'text-success' : 'text-danger'}`}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {ok ? 'Configured' : 'Not configured'}
    </span>
  </div>
);

const AdminSettings = () => {
  const status = useAsync(() => adminService.systemStatus(), []);

  if (status.loading && !status.data) return <LoadingState label="Loading system status…" />;
  if (status.status === 'error') return <ErrorState message={status.error.message} onRetry={status.reload} />;
  const s = status.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">System Settings & Status</h1>
        <p className="text-text-secondary text-sm">Secrets are configured through environment variables on the server, never in the browser.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary" /> Backend integrations
          </h3>
          {SERVICES.map((svc) => (
            <Row key={svc.id} ok={s.integrations[svc.id]} name={svc.name} hint={svc.env} />
          ))}
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary" /> Server
            </h3>
            <Row ok={s.database.state === 'connected'} name={`MongoDB (${s.database.name})`} hint={s.database.state} />
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div className="bg-primary/5 rounded-xl p-3">
                <p className="text-xl font-bold text-text-primary">{s.connectedUsers}</p>
                <p className="text-[11px] text-text-secondary uppercase font-semibold">Online users</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3">
                <p className="text-xl font-bold text-text-primary">{Math.floor(s.uptimeSeconds / 3600)}h {Math.floor((s.uptimeSeconds % 3600) / 60)}m</p>
                <p className="text-[11px] text-text-secondary uppercase font-semibold">Uptime</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3">
                <p className="text-xl font-bold text-text-primary">{s.nodeVersion}</p>
                <p className="text-[11px] text-text-secondary uppercase font-semibold">Node.js</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Frontend build</h3>
            <Row ok name="Leaflet map (OpenStreetMap tiles)" hint="VITE_MAP_TILE_URL (optional)" />
            <Row ok={isFirebaseConfigured()} name="Firebase web push" hint="VITE_FIREBASE_*" />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
