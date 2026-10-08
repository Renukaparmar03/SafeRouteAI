import api from './api';

export const aiService = {
  chat: ({ message, tripId, latitude, longitude, conversationId }) =>
    api.post('/ai/chat', { message, tripId, latitude, longitude, conversationId }, { timeout: 60000 }),
  history: () => api.get('/ai/history'),
  clear: () => api.delete('/ai/history'),
};
