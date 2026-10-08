import api from './api';

export const riskService = {
  /** Active zones as a GeoJSON FeatureCollection, optionally limited to a bounding box. */
  list: (params = {}) => api.get('/risk-zones', { params }),
  nearby: ({ latitude, longitude }, radius = 5000) =>
    api.get('/risk-zones/nearby', { params: { lat: latitude, lng: longitude, radius } }).then((d) => d.zones),
  get: (id) => api.get(`/risk-zones/${id}`).then((d) => d.zone),
};

export const safetyService = {
  check: ({ latitude, longitude }) => api.get('/safety/check', { params: { lat: latitude, lng: longitude } }),
  forecast: ({ latitude, longitude }) => api.get('/safety/forecast', { params: { lat: latitude, lng: longitude } }),
};
