import api from './api';

export const adminService = {
  stats: () => api.get('/admin/stats'),
  systemStatus: () => api.get('/admin/system-status'),
  users: (params) => api.get('/admin/users', { params }),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload).then((d) => d.user),
  trips: (params) => api.get('/admin/trips', { params }).then((d) => d.trips),
  alerts: (params) => api.get('/admin/alerts', { params }),
  resolveAlert: (id) => api.put(`/admin/alerts/${id}/resolve`).then((d) => d.alert),
  zones: (params = {}) => api.get('/admin/risk-zones', { params: { includeInactive: 'true', ...params } }),
  zone: (id) => api.get(`/risk-zones/${id}`).then((d) => d.zone),
  createZone: (payload) => api.post('/admin/risk-zones', payload).then((d) => d.zone),
  updateZone: (id, payload) => api.put(`/admin/risk-zones/${id}`, payload).then((d) => d.zone),
  disableZone: (id) => api.delete(`/admin/risk-zones/${id}`).then((d) => d.zone),
  deleteZone: (id) => api.delete(`/admin/risk-zones/${id}`, { params: { hard: 'true' } }),
  sendNotification: (payload) => api.post('/admin/notifications', payload),
  notificationHistory: () => api.get('/admin/notifications').then((d) => d.history),
};
