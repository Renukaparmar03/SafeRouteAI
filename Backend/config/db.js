import mongoose from 'mongoose';

import { setServers } from "dns";

setServers(["8.8.8.8", "8.8.4.4"]);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // We won't exit the process here so that the app doesn't crash completely during local testing
    // process.exit(1);
  }
};

export default connectDB;
