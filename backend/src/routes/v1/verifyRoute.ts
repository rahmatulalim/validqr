import { Router } from 'express';
import { scanQR } from '../../controllers/scanController';

const router = Router();

/**
 * POST /api/v1/verify/scan
 * Validate a scanned QRIS payload through 3 security layers.
 */
router.post('/scan', scanQR);

export default router;
