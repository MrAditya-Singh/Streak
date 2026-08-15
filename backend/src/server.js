import dotenv from 'dotenv';
import app from './app.js';
import { startCronService } from './services/cronService.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`⚡ Streak Backend API running in [${NODE_ENV}] mode`);
  console.log(`📡 Server URL : http://localhost:${PORT}`);
  console.log(`🩺 Health API : http://localhost:${PORT}/api/health`);
  console.log(`🔗 Connect API: http://localhost:${PORT}/api/integrations/connect`);
  console.log(`👥 Auth API   : http://localhost:${PORT}/api/auth/users`);
  console.log(`=================================================`);

  // Start background auto-sync worker (Every 30 minutes)
  try {
    startCronService('*/30 * * * *');
  } catch (cronErr) {
    console.warn('Could not initialize background cron:', cronErr.message);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection! Shutting down server...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception! Shutting down server...', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Process terminated.');
  });
});
