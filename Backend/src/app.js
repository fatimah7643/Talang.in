import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import billRoutes from './routes/billRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
  },
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server API Talang.in aktif!',
    version: 'v1',
    endpoints: [
      '/api/v1/auth',
      '/api/v1/profiles',
      '/api/v1/groups',
      '/api/v1/bills',
      '/api/v1/settlements',
      '/api/v1/analytics',
      '/api/v1/notifications'
    ]
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/settlements', settlementRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan!`
  });
});

export default app;