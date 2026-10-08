import api from './api';

export const emergencyService = {
  services: ({ latitude, longitude }, category = 'all', limit = 3) =>
    api.get('/emergency/services', { params: { lat: latitude, lng: longitude, category, limit } }),
  triggerSos: (payload) => api.post('/emergency/sos', payload),
  activeSos: () => api.get('/emergency/sos/active').then((d) => d.sos),
  cancelSos: (id) => api.put(`/emergency/sos/${id}/cancel`).then((d) => d.sos),
};
