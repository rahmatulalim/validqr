import { Router, Request, Response } from 'express';
import verifyRoute from './v1/verifyRoute';
import notifyRoute from './v1/notifyRoute';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Health check — no auth required
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'ValidQR API Gateway',
  });
});

// v1 routes — auth middleware applied
router.use('/api/v1/verify', authMiddleware, verifyRoute);
router.use('/api/v1/notify', authMiddleware, notifyRoute);

export default router;
