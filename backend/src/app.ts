import express from 'express';
import cors from 'cors';
import router from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { testDbConnection } from './config/db';
import { connectRedis } from './config/redis';
import { config } from './config/env';

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (config.nodeEnv !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ── Routes ──────────────────────────────────────────────────
app.use(router);

// ── Error handling (must be last) ──────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  // Connect to dependencies
  await testDbConnection();
  await connectRedis();

  app.listen(config.port, () => {
    console.log(`\n🚀 ValidQR API Gateway running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Fuzzy threshold: ${config.fuzzyWarningThreshold}%`);
    console.log(`   Geofence radius: ${config.geofenceRadiusMeters}m\n`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
