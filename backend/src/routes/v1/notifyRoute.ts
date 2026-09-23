import { Router } from 'express';
import { sendAlert } from '../../controllers/alertController';

const router = Router();

/**
 * POST /api/v1/notify/fraud-alert
 * Send WhatsApp fraud alert to a registered merchant.
 */
router.post('/fraud-alert', sendAlert);

export default router;
