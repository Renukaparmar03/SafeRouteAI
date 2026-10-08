import mongoose from 'mongoose';
import { setServers } from 'dns';
import { env } from './env.js';

// Operator injection is prevented at the edge: every request body/query is
// validated with zod and stripped of "$"/"." keys (see middleware/validate.js).
mongoose.set('strictQuery', true);

const connectDB = async () => {
  // Some networks cannot resolve Atlas SRV records with the system resolver.
  // Set MONGODB_DNS_SERVERS=8.8.8.8,8.8.4.4 to use custom DNS servers.
  if (env.mongoDnsServers) {
    setServers(env.mongoDnsServers.split(',').map((s) => s.trim()));
  }

  const conn = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

export default connectDB;
