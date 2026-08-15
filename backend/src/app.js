import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import healthRoutes from './routes/health.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import authRoutes from './routes/auth.routes.js';
import { syncRouter } from './routes/sync.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ==========================================
// Middleware Configuration
// ==========================================
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    status: err.status || 500,
  });
});

export default app;
