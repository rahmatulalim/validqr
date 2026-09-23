import axios from 'axios';
import { config } from '../config/env';
import { pool } from '../config/db';

export interface FraudAlertPayload {
  nmid: string;
  suspectedMerchantName: string;
  buyerLocation?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: string;
  targetWaNumber?: string;
}

/**
 * Format the WhatsApp fraud alert message body.
 */
const formatAlertMessage = (payload: FraudAlertPayload): string => {
  const timestamp = payload.timestamp
    ? new Date(payload.timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    : new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  return (
    `🚨 *PERINGATAN FRAUD — ValidQR*\n\n` +
    `Terdeteksi percobaan penipuan menggunakan QRIS Anda.\n\n` +
    `📍 *Detail Insiden:*\n` +
    `• Nama pada stiker: ${payload.suspectedMerchantName}\n` +
    `• NMID yang terdeteksi: ${payload.nmid}\n` +
    `• Waktu: ${timestamp}\n` +
    (payload.buyerLocation
      ? `• Lokasi approx: ${payload.buyerLocation.latitude.toFixed(4)}, ${payload.buyerLocation.longitude.toFixed(4)}\n`
      : '') +
    `\n✅ Transaksi telah *diblokir* oleh sistem ValidQR.\n\n` +
    `Jika ini bukan Anda, segera laporkan ke:\n` +
    `📞 NusaPay Support: 1500-XXX`
  );
};

/**
 * Send a WhatsApp fraud alert to the registered merchant number.
 *
 * Fetches the merchant's WhatsApp number from the database (or uses
 * the targetWaNumber override for testing), then calls the WhatsApp
 * Business API.
 *
 * Failure is non-fatal — the alert is logged to incident_logs even
 * if WhatsApp delivery fails (e.g., API unavailable, rate limited).
 *
 * @param payload Fraud alert details
 * @returns true if WA message was sent successfully
 */
export const sendFraudAlert = async (payload: FraudAlertPayload): Promise<boolean> => {
  let waNumber = payload.targetWaNumber;

  // Lookup merchant's WA number from DB if not provided
  if (!waNumber) {
    try {
      const result = await pool.query<{ wa_number: string }>(
        'SELECT wa_number FROM merchants WHERE nmid = $1 LIMIT 1',
        [payload.nmid]
      );
      waNumber = result.rows[0]?.wa_number ?? undefined;
    } catch (err) {
      console.error('[WhatsApp] Failed to fetch merchant WA number:', err);
    }
  }

  if (!waNumber) {
    console.warn('[WhatsApp] No WA number available for fraud alert — alert skipped.');
    return false;
  }

  if (!config.waApiUrl || !config.waApiToken) {
    console.warn('[WhatsApp] WA_API_URL or WA_API_TOKEN not configured — alert skipped.');
    return false;
  }

  const messageBody = formatAlertMessage(payload);

  try {
    const response = await axios.post(
      config.waApiUrl,
      {
        messaging_product: 'whatsapp',
        to: waNumber,
        type: 'text',
        text: { body: messageBody },
      },
      {
        headers: {
          Authorization: `Bearer ${config.waApiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    console.log(`[WhatsApp] Fraud alert sent to ${waNumber}. Message ID: ${response.data?.messages?.[0]?.id}`);
    return true;
  } catch (err) {
    const error = err as Error;
    console.error('[WhatsApp] Failed to send fraud alert:', error.message);
    return false;
  }
};
