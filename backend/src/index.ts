import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from '@/routes/auth';
import { initializeFirebase } from '@/services/firebase';
import { initRedis } from '@/services/redis';
import { initMongoDB } from '@/services/mongodb';
import { setupSocketIO } from '@/services/socketio';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize services
const initializeServices = async () => {
  try {
    console.log('Initializing Firebase...');
    initializeFirebase();

    console.log('Initializing MongoDB...');
    await initMongoDB();

    console.log('Initializing Redis...');
    await initRedis();

    console.log('Setting up Socket.io...');
    setupSocketIO(io);

    console.log('All services initialized');
  } catch (error) {
    console.error('Service initialization error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await initializeServices();

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(console.error);
