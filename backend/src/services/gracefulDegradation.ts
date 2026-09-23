import { Merchant, NmidValidationResult } from './nmidValidator';

export interface DegradedResult {
  status: 'VERIFIED';
  color: 'GREEN';
  message: string;
  score: number;
  gpsChecked: false;
  degraded: true;
  merchant: {
    nmid: string;
    name: string;
  };
}

/**
 * Graceful Degradation handler for when GPS is unavailable.
 *
 * When GPS coordinates are not provided (null/undefined) — for example,
 * when the buyer is indoors or has denied location permission — Layer 3
 * (geofencing) is skipped entirely.
 *
 * Instead, the system falls back to the combined result of:
 *   - Layer 1: NMID has already been validated (merchant exists in DB)
 *   - Layer 2: Fuzzy score has already been computed and is above threshold
 *
 * This guarantees 100% fallback reliability (SLA requirement).
 *
 * @param nmidResult Result from Layer 1 NMID validation (must be valid)
 * @param fuzzyScore Result score from Layer 2 (must be above threshold)
 * @returns VERIFIED response with degraded flag
 */
export const gracefulDegradation = (
  nmidResult: NmidValidationResult,
  fuzzyScore: number
): DegradedResult => {
  const merchant = nmidResult.merchant as Merchant;

  return {
    status: 'VERIFIED',
    color: 'GREEN',
    message: 'Transaksi aman. GPS tidak tersedia, validasi berdasarkan NMID dan nama merchant.',
    score: fuzzyScore,
    gpsChecked: false,
    degraded: true,
    merchant: {
      nmid: merchant.nmid,
      name: merchant.name,
    },
  };
};
