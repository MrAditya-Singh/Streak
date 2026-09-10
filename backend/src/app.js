import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import healthRoutes from './routes/health.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import authRoutes from './routes/auth.routes.js';
import { syncRouter } from './routes/sync.routes.js';
import { uploadRouter } from './routes/upload.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure data/uploads directory exists
const uploadsPath = path.resolve(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// ==========================================
// Middleware Configuration
// ==========================================
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://localhost:3000').split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Capacitor, local files)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    // Allow surge.sh, vercel.app, onrender.com, localhost, and local IPs
    if (
      /\.surge\.sh$/.test(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /\.onrender\.com$/.test(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
      origin.startsWith('capacitor://') ||
      origin.startsWith('ionic://') ||
      origin.startsWith('http://localhost')
    ) {
      callback(null, true);
      return;
    }
    // Safe default to ensure cross-device web & downloaded app synchronization
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file hosting for uploaded photos (.jpg)
app.use('/uploads', express.static(uploadsPath));

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.originalUrl.startsWith('/@') && !req.originalUrl.includes('.js') && !req.originalUrl.includes('.css')) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ==========================================
// API Routes
// ==========================================
app.use('/api/health', healthRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRouter);
app.use('/api/upload', uploadRouter);

// ==========================================
// Production Static Hosting (React Frontend Dist)
// ==========================================
const distPath = path.resolve(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback to index.html for all frontend routes
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Root Welcome Endpoint when dist is not present
  app.get('/', (req, res) => {
    res.status(200).json({
      message: '⚡ Welcome to Streak Backend API',
      status: 'online',
      docs: {
        health: '/api/health',
      },
    });
  });
}

// 404 Catch-all Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    status: 404,
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    status: err.status || 500,
  });
});

export default app;
