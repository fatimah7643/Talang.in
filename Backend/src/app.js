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

// ── RATE LIMITER (in-memory, tanpa package tambahan) ─────────────────────────
const rateLimitStore = new Map();
 
function rateLimit({ windowMs = 15 * 60 * 1000, max = 100, message = 'Terlalu banyak request.' } = {}) {
  return (req, res, next) => {
    const ip  = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(ip);
 
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      return res.status(429).json({ success: false, message });
    }
    entry.count++;
    next();
  };
}
 
// Bersihkan store setiap 30 menit agar tidak memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 30 * 60 * 1000);
 
// Auth: max 10 request / 15 menit (proteksi brute force login)
const authLimiter      = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' });
// Analytics: max 30 request / menit (buka halaman analytics tidak spam health score)
const analyticsLimiter = rateLimit({ windowMs: 60 * 1000,       max: 30,  message: 'Terlalu banyak request analytics. Tunggu sebentar.' });
// Umum: max 120 request / menit
const generalLimiter   = rateLimit({ windowMs: 60 * 1000,       max: 120, message: 'Terlalu banyak request. Coba lagi sebentar.' });
 
// ── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// Sembunyikan pesan internal di production — jangan expose stack trace ke client
const isProd = process.env.NODE_ENV === 'production';

// ROUTES

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

app.use('/api/v1/auth',          authLimiter,      authRoutes);
app.use('/api/v1/profiles',      generalLimiter,   profileRoutes);
app.use('/api/v1/groups',        generalLimiter,   groupRoutes);
app.use('/api/v1/bills',         generalLimiter,   billRoutes);
app.use('/api/v1/settlements',   generalLimiter,   settlementRoutes);
app.use('/api/v1/analytics',     analyticsLimiter, analyticsRoutes);
app.use('/api/v1/notifications', generalLimiter,   notificationRoutes);

// 404 handler

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan!`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Terjadi kesalahan pada server.' : err.message,
  });
});

export default app;