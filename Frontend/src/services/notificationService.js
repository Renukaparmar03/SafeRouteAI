import api from './api';

export const notificationService = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`).then((d) => d.notification),
  markAllRead: () => api.put('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
  pushConfig: () => api.get('/notifications/config'),
  registerToken: (token) => api.post('/notifications/register-token', { token }),
  unregisterToken: (token) => api.delete('/notifications/register-token', { data: { token } }),
};
