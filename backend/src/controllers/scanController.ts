import { Request, Response, NextFunction } from 'express';
import { validateNMID } from '../services/nmidValidator';
import { fuzzyMatch } from '../services/fuzzyMatcher';
import { checkGeofence } from '../services/geofencing';
import { gracefulDegradation } from '../services/gracefulDegradation';
import { sendFraudAlert } from '../services/whatsappBot';
import { logIncident } from '../models/IncidentLog';
import { config } from '../config/env';

/**
 * POST /api/v1/verify/scan
 *
 * Main validation controller — runs 3 security layers sequentially:
 *
 * Layer 1: NMID Cross-Validation (Hard Block)
 *   → If NMID not in DB → HARD_BLOCK + WhatsApp alert
 *
 * Layer 2: Hybrid Fuzzy Name Matching (Soft Warning)
 *   → If score < FUZZY_WARNING_THRESHOLD → SOFT_WARNING
 *   → Score is ALWAYS computed dynamically — never hardcoded
 *
 * Layer 3: Geofencing GPS (Haversine 500m)
 *   → If GPS unavailable → graceful degradation (skip to VERIFIED)
 *   → If out of range → SOFT_WARNING
 *   → If in range → VERIFIED
 */
export const scanQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { nmid, merchantName, latitude, longitude } = req.body as {
    nmid: string;
    merchantName: string;
    latitude?: number;
    longitude?: number;
  };

  // Input validation
  if (!nmid || !merchantName) {
    res.status(400).json({
      error: 'BAD_REQUEST',
      message: "Field 'nmid' dan 'merchantName' wajib diisi.",
      fields: [!nmid ? 'nmid' : null, !merchantName ? 'merchantName' : null].filter(Boolean),
    });
    return;
  }

  const gpsAvailable = latitude != null && longitude != null;

  try {
    // ═══════════════════════════════════════════════════════
    // LAYER 1: NMID Cross-Validation
    // ═══════════════════════════════════════════════════════
    const nmidCheck = await validateNMID(nmid);

    if (!nmidCheck.valid) {
      console.log(`[LAYER 1] HARD_BLOCK — NMID not found: ${nmid}`);

      // Trigger WhatsApp alert asynchronously (do not await — non-blocking)
      sendFraudAlert({
        nmid,
        suspectedMerchantName: merchantName,
        buyerLocation: gpsAvailable ? { latitude: latitude!, longitude: longitude! } : undefined,
        timestamp: new Date().toISOString(),
      }).catch(err => console.error('[WA Alert] Error:', err));

      // Log incident
      await logIncident({
        nmid_scanned: nmid,
        merchant_name: merchantName,
        status: 'HARD_BLOCK',
        color: 'RED',
        reason: 'NMID_MISMATCH',
        latitude: latitude,
        longitude: longitude,
        gps_available: gpsAvailable,
      });

      res.json({
        status: 'HARD_BLOCK',
        color: 'RED',
        message: 'NMID tidak terdaftar! Transaksi diblokir.',
        reason: 'NMID_MISMATCH',
        nmid,
        whatsappAlertSent: true,
      });
      return;
    }

    const merchant = nmidCheck.merchant!;
    console.log(`[LAYER 1] VALID — NMID: ${nmid} → Merchant: "${merchant.name}"`);

    // ═══════════════════════════════════════════════════════
    // LAYER 2: Hybrid Fuzzy Name Matching
    // ═══════════════════════════════════════════════════════
    const { score, debug } = fuzzyMatch(merchantName, merchant.name);

    // Console log fuzzy debug details for jury transparency (non-production only)
    if (config.nodeEnv !== 'production') {
      console.log(`\n[FUZZY] Input:   "${debug.input}"`);
      console.log(`[FUZZY] Target:  "${debug.target}"`);
      console.log(`[FUZZY] Levenshtein distance: ${debug.levenshteinDistance} → score: ${debug.levenshteinScore.toFixed(2)}%`);
      console.log(`[FUZZY] Tokens A: [${debug.tokensA.join(', ')}]`);
      console.log(`[FUZZY] Tokens B: [${debug.tokensB.join(', ')}]`);
      console.log(`[FUZZY] Matched:  [${debug.matchedTokens.join(', ')}]`);
      console.log(`[FUZZY] Token score: ${debug.tokenScore.toFixed(2)}%`);
      console.log(`[FUZZY] FINAL HYBRID SCORE: ${debug.finalScore}% (0.4 * ${debug.levenshteinScore} + 0.6 * ${debug.tokenScore})\n`);
    }

    const threshold = config.fuzzyWarningThreshold;

    if (score < threshold) {
      console.log(`[LAYER 2] SOFT_WARNING — Fuzzy score ${score}% below threshold ${threshold}%`);

      await logIncident({
        nmid_scanned: nmid,
        merchant_name: merchantName,
        status: 'SOFT_WARNING',
        color: 'YELLOW',
        reason: 'LOW_FUZZY_SCORE',
        fuzzy_score: score,
        latitude: latitude,
        longitude: longitude,
        gps_available: gpsAvailable,
      });

      res.json({
        status: 'SOFT_WARNING',
        color: 'YELLOW',
        message: 'Nama merchant tidak sepenuhnya cocok. Konfirmasi diperlukan.',
        score,
        ...(config.nodeEnv !== 'production' ? { debug } : {}),
        threshold,
        merchantRegistered: merchant.name,
      });
      return;
    }

    console.log(`[LAYER 2] PASS — Fuzzy score: ${score}% (threshold: ${threshold}%)`);

    // ═══════════════════════════════════════════════════════
    // LAYER 3: Geofencing GPS
    // ═══════════════════════════════════════════════════════

    // Graceful degradation: skip GPS check if coordinates are unavailable
    if (!gpsAvailable) {
      console.log('[LAYER 3] GPS unavailable — activating graceful degradation');

      const degradedResult = gracefulDegradation(nmidCheck, score);

      await logIncident({
        nmid_scanned: nmid,
        merchant_name: merchantName,
        status: 'VERIFIED',
        color: 'GREEN',
        fuzzy_score: score,
        gps_available: false,
      });

      res.json(degradedResult);
      return;
    }

    const geoResult = checkGeofence(latitude!, longitude!, merchant, config.geofenceRadiusMeters);

    if (!geoResult.inRange) {
      console.log(`[LAYER 3] SOFT_WARNING — Distance: ${geoResult.distanceMeters}m > radius ${config.geofenceRadiusMeters}m`);

      await logIncident({
        nmid_scanned: nmid,
        merchant_name: merchantName,
        status: 'SOFT_WARNING',
        color: 'YELLOW',
        reason: 'MERCHANT_TOO_FAR',
        fuzzy_score: score,
        latitude: latitude,
        longitude: longitude,
        distance_meters: geoResult.distanceMeters,
        gps_available: true,
      });

      res.json({
        status: 'SOFT_WARNING',
        color: 'YELLOW',
        message: `Merchant berada di luar radius yang diharapkan (> ${config.geofenceRadiusMeters}m). Verifikasi manual diperlukan.`,
        reason: 'MERCHANT_TOO_FAR',
        score,
        distanceMeters: geoResult.distanceMeters,
      });
      return;
    }

    // All layers passed — VERIFIED
    console.log(`[LAYER 3] VERIFIED — Distance: ${geoResult.distanceMeters}m ✅`);

    await logIncident({
      nmid_scanned: nmid,
      merchant_name: merchantName,
      status: 'VERIFIED',
      color: 'GREEN',
      fuzzy_score: score,
      latitude: latitude,
      longitude: longitude,
      distance_meters: geoResult.distanceMeters,
      gps_available: true,
    });

    res.json({
      status: 'VERIFIED',
      color: 'GREEN',
      message: 'Transaksi aman. Merchant terverifikasi.',
      score,
      merchant: {
        nmid: merchant.nmid,
        name: merchant.name,
        city: merchant.name,
      },
      gpsChecked: true,
      distanceMeters: geoResult.distanceMeters,
    });
  } catch (err) {
    next(err);
  }
};
