import api from './api';

export const mapService = {
  search: (q, near) =>
    api.get('/map/search', { params: { q, ...(near ? { lat: near.latitude, lng: near.longitude } : {}) } }).then((d) => d.results),
  reverseGeocode: ({ latitude, longitude }) =>
    api.get('/map/reverse-geocode', { params: { lat: latitude, lng: longitude } }).then((d) => d.place),
  /** Route analysis: directions + risk zones + weather + safety score per route. */
  route: (payload) => api.post('/map/route', payload),
  nearby: ({ latitude, longitude }, category = 'all', limit = 5) =>
    api.get('/map/nearby', { params: { lat: latitude, lng: longitude, category, limit } }),
};
