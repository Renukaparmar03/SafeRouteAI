import { createServer } from 'http';
import mongoose from 'mongoose';
import { env, validateEnv } from './config/env.js';
import connectDB from './config/db.js';
import app from './app.js';
import { initSocket } from './sockets/trackingSocket.js';

const start = async () => {
  try {
    validateEnv();
    await connectDB();
  } catch (error) {
    console.error(`[startup] ${error.message}`);
    process.exit(1);
  }

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] SafeRoute AI API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[server] Allowed client origins: ${env.clientUrls.join(', ')}`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    httpServer.close();
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

start();
