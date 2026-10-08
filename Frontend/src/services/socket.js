import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';

let socket = null;

/** Opens the authenticated Socket.IO connection (auth uses the HTTP-only cookie). */
export const connectSocket = () => {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionDelayMax: 10000,
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
