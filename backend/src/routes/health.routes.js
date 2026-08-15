import { Router } from 'express';
import { isFirebaseInitialized } from '../config/firebase.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Check server operational status, uptime, and system diagnostics
 * @access  Public
 */
router.get('/', (req, res) => {
  const uptimeSeconds = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: 'healthy',
    service: 'Streak API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptimeSeconds)}s`,
    environment: process.env.NODE_ENV || 'development',
    firestore: isFirebaseInitialized ? 'connected' : 'not_configured',
    system: {
      memoryUsageMB: {
        rss: (memoryUsage.rss / 1024 / 1024).toFixed(2),
        heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
        heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      },
      nodeVersion: process.version,
    },
  });
});

export default router;
