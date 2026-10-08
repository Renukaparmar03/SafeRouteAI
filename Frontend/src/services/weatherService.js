import api from './api';

export const weatherService = {
  get: ({ latitude, longitude }) => api.get('/weather', { params: { lat: latitude, lng: longitude } }),
};
