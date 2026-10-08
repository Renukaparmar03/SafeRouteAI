import api from './api';
import { getSocket } from './socket';

const emitWithAck = (event, payload, timeoutMs = 15000) =>
  new Promise((resolve, reject) => {
    const socket = getSocket();
    if (!socket?.connected) {
      reject(new Error('offline'));
      return;
    }
    socket.timeout(timeoutMs).emit(event, payload, (err, response) => {
      if (err) reject(new Error('Live tracking server did not respond.'));
      else if (!response?.ok) reject(new Error(response?.message || 'Live tracking failed.'));
      else resolve(response.data);
    });
  });

export const trackingService = {
  /** Sends a location update over Socket.IO, falling back to REST when the socket is down. */
  sendLocation: async (payload) => {
    try {
      return await emitWithAck('journey:location', payload);
    } catch (error) {
      if (error.message !== 'offline') throw error;
      return api.post('/tracking/location', payload);
    }
  },
  start: (tripId) => api.post('/tracking/start', { tripId }).then((d) => d.trip),
  stop: (tripId) => api.post('/tracking/stop', { tripId }).then((d) => d.trip),
  history: (tripId) => api.get(`/tracking/${tripId}`),
};
