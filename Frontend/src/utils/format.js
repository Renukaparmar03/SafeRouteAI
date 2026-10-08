export const formatDistance = (meters) => {
  if (!Number.isFinite(meters)) return '—';
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
};

export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return '—';
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const formatTime = (value) =>
  value ? new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';

export const formatDateTime = (value) => (value ? `${formatDate(value)}, ${formatTime(value)}` : '—');

export const timeAgo = (value) => {
  if (!value) return '';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) {
    const sameDay = new Date(value).toDateString() === new Date().toDateString();
    return sameDay ? formatTime(value) : 'Yesterday';
  }
  if (seconds < 172800) return 'Yesterday';
  return formatDate(value);
};

export const formatCoords = (lat, lng) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '—';
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
};

export const RISK_LABEL = { LOW: 'Low Risk', MEDIUM: 'Medium Risk', HIGH: 'High Risk' };
export const RISK_COLORS = { LOW: '#22C55E', MEDIUM: '#F59E0B', HIGH: '#EF4444' };
export const SOURCE_LABEL = { OFFICIAL: 'Official data', ADMIN: 'Admin verified', COMMUNITY: 'Community report', DEMO: 'DEMO data' };

/** [[minLng, minLat], [maxLng, maxLat]] for a list of [lng, lat] points. */
export const boundsOf = (points) => {
  const valid = points.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!valid.length) return null;
  const lngs = valid.map((p) => p[0]);
  const lats = valid.map((p) => p[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
};

/** Haversine distance in metres between two { latitude, longitude } points. */
export const distanceBetween = (a, b) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
