import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { resolveUserFromToken } from '../middleware/authMiddleware.js';
import { readTokenFromCookieHeader } from '../utils/tokenUtils.js';
import { locationSchema, trackingTripSchema } from '../validators/schemas.js';
import { endJourney, processLocation, startJourney } from '../services/trackingService.js';
import { ADMIN_ROOM, setIO, userRoom } from './socketEmitter.js';

const MIN_LOCATION_INTERVAL_MS = 2000;

const errorMessage = (error) => (error?.issues ? error.issues[0]?.message : error?.message) || 'Something went wrong';

/** Wraps an async socket handler so it always answers the client's ack callback. */
const handler = (fn) => async (payload, ack) => {
  const reply = typeof ack === 'function' ? ack : () => {};
  try {
    reply({ ok: true, data: await fn(payload ?? {}) });
  } catch (error) {
    reply({ ok: false, message: errorMessage(error) });
  }
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrls, credentials: true },
    maxHttpBufferSize: 64 * 1024,
  });

  // Only authenticated users may connect; the JWT comes from the HTTP-only cookie.
  io.use(async (socket, next) => {
    const token = readTokenFromCookieHeader(socket.handshake.headers.cookie);
    const user = await resolveUserFromToken(token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    socket.data.userId = user._id.toString();
    next();
  });

  io.on('connection', (socket) => {
    const { user, userId } = socket.data;
    socket.join(userRoom(userId));
    if (user.role === 'admin') socket.join(ADMIN_ROOM);

    let lastLocationAt = 0;

    socket.on(
      'journey:start',
      handler(async (payload) => startJourney(user, trackingTripSchema.parse(payload).tripId))
    );

    socket.on(
      'journey:location',
      handler(async (payload) => {
        const now = Date.now();
        if (now - lastLocationAt < MIN_LOCATION_INTERVAL_MS) return { throttled: true };
        lastLocationAt = now;
        const status = await processLocation(user, locationSchema.parse(payload));
        // Mirror to the user's other tabs/devices.
        socket.to(userRoom(userId)).emit('journey:location', status);
        return status;
      })
    );

    socket.on(
      'journey:end',
      handler(async (payload) => endJourney(user, trackingTripSchema.parse(payload).tripId))
    );
  });

  setIO(io);
  return io;
};
