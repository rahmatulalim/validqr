import { pool } from '../config/db';
import { cacheGet, cacheSet } from '../config/redis';

/**
 * Merchant entity as stored in PostgreSQL.
 */
export interface Merchant {
  id: number;
  nmid: string;
  name: string;
  latitude: number;
  longitude: number;
  wa_number: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NmidValidationResult {
  valid: boolean;
  merchant?: Merchant;
}

const CACHE_PREFIX = 'merchant:';
const CACHE_TTL_SECONDS = 300; // 5 minutes

/**
 * Validate an NMID against the merchants database.
 *
 * Validation logic:
 * 1. Check Redis cache first (cache hit → return immediately)
 * 2. Query PostgreSQL if cache miss
 * 3. On DB hit → cache the result for 5 minutes
 * 4. Return { valid: false } if NMID not in DB (this triggers HARD_BLOCK for Stiker B)
 *
 * NOTE: The penipu NMID (ID99999999980) deliberately does NOT exist in the merchants table.
 * This ensures Layer 1 always hard-blocks fraudulent transactions.
 *
 * @param nmid National Merchant ID from the scanned QR payload
 */
export const validateNMID = async (nmid: string): Promise<NmidValidationResult> => {
  const cacheKey = `${CACHE_PREFIX}${nmid}`;

  // 1. Try Redis cache
  const cached = await cacheGet(cacheKey);
  if (cached) {
    const merchant = JSON.parse(cached) as Merchant;
    return { valid: true, merchant };
  }

  // 2. Query PostgreSQL
  const result = await pool.query<Merchant>(
    'SELECT * FROM merchants WHERE nmid = $1 AND is_active = true',
    [nmid]
  );

  if (result.rows.length === 0) {
    return { valid: false };
  }

  const merchant = result.rows[0];

  // 3. Cache for future requests
  await cacheSet(cacheKey, JSON.stringify(merchant), CACHE_TTL_SECONDS);

  return { valid: true, merchant };
};
