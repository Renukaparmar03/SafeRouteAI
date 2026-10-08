import api from './api';

export const tripService = {
  list: (status) => api.get('/trips', { params: status ? { status } : {} }).then((d) => d.trips),
  get: (id) => api.get(`/trips/${id}`),
  create: (payload) => api.post('/trips', payload).then((d) => d.trip),
  update: (id, payload) => api.put(`/trips/${id}`, payload).then((d) => d.trip),
  remove: (id) => api.delete(`/trips/${id}`),
  start: (id) => api.post(`/trips/${id}/start`).then((d) => d.trip),
  end: (id) => api.post(`/trips/${id}/end`).then((d) => d.trip),
};
