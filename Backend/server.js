import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';


// Load env variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Socket.io Setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('SafeRoute AI Backend is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Database Connection & Server Start
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
