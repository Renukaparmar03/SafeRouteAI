/**
 * Holds the Socket.IO server instance so services can emit events without
 * importing the socket bootstrap (avoids circular imports).
 *
 * Rooms:
 *   user:<userId>  – private room per user (all of their tabs/devices)
 *   admins         – every connected admin
 */
let io = null;

export const setIO = (instance) => {
  io = instance;
};

export const userRoom = (userId) => `user:${userId}`;
export const ADMIN_ROOM = 'admins';

export const emitToUser = (userId, event, payload) => {
  io?.to(userRoom(userId.toString())).emit(event, payload);
};

export const emitToAdmins = (event, payload) => {
  io?.to(ADMIN_ROOM).emit(event, payload);
};

export const emitToAllUsers = (event, payload) => {
  io?.emit(event, payload);
};

export const connectedUserCount = async () => {
  if (!io) return 0;
  const sockets = await io.fetchSockets();
  return new Set(sockets.map((s) => s.data.userId)).size;
};
