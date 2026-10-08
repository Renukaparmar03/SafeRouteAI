import api from './api';

export const alertService = {
  list: (params = {}) => api.get('/alerts', { params }),
  markRead: (id) => api.put(`/alerts/${id}/read`).then((d) => d.alert),
  markAllRead: () => api.put('/alerts/read-all'),
};
