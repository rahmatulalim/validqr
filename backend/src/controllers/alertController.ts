import { Request, Response, NextFunction } from 'express';
import { sendFraudAlert } from '../services/whatsappBot';

/**
 * POST /api/v1/notify/fraud-alert
 *
 * Manually trigger a WhatsApp fraud alert.
 * This endpoint is called internally by scanController on HARD_BLOCK,
 * but can also be triggered manually for testing or re-alerts.
 */
export const sendAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { nmid, suspectedMerchantName, buyerLocation, timestamp } = req.body as {
    nmid: string;
    suspectedMerchantName: string;
    buyerLocation?: { latitude: number; longitude: number };
    timestamp?: string;
  };

  if (!nmid || !suspectedMerchantName) {
    res.status(400).json({
      error: 'BAD_REQUEST',
      message: "Field 'nmid' dan 'suspectedMerchantName' wajib diisi.",
    });
    return;
  }

  try {
    const success = await sendFraudAlert({
      nmid,
      suspectedMerchantName,
      buyerLocation,
      timestamp,
    });

    if (success) {
      res.json({
        success: true,
        message: 'Fraud alert berhasil dikirim ke merchant.',
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'WHATSAPP_UNAVAILABLE',
        message: 'WhatsApp API tidak dapat dihubungi. Alert dicatat di database.',
      });
    }
  } catch (err) {
    next(err);
  }
};
