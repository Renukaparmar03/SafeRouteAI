import api from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((d) => d.user),
  login: ({ emailOrPhone, password, role }) => api.post('/auth/login', { emailOrPhone, password, role }).then((d) => d.user),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me', { skipAuthRedirect: true }).then((d) => d.user),
};

export const userService = {
  getMe: () => api.get('/users/me').then((d) => d.user),
  updateMe: (payload) => api.put('/users/me', payload).then((d) => d.user),
  listContacts: () => api.get('/users/me/emergency-contacts').then((d) => d.contacts),
  createContact: (payload) => api.post('/users/me/emergency-contacts', payload).then((d) => d.contact),
  updateContact: (id, payload) => api.put(`/users/me/emergency-contacts/${id}`, payload).then((d) => d.contact),
  deleteContact: (id) => api.delete(`/users/me/emergency-contacts/${id}`),
};
