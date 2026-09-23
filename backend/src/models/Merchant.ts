import { pool } from '../config/db';

/**
 * Merchant entity type — mirrors the merchants PostgreSQL table.
 * This is the type-only re-export for use in other modules.
 * Full CRUD is handled via nmidValidator.ts (read) and direct SQL (write).
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

/**
 * Find a merchant by NMID.
 * This is a direct DB query — use nmidValidator.ts (with caching) in production code.
 *
 * @param nmid National Merchant ID
 */
export const findMerchantByNmid = async (nmid: string): Promise<Merchant | null> => {
  const result = await pool.query<Merchant>(
    'SELECT * FROM merchants WHERE nmid = $1 AND is_active = true LIMIT 1',
    [nmid]
  );
  return result.rows[0] ?? null;
};

/**
 * Get all active merchants.
 */
export const getAllMerchants = async (): Promise<Merchant[]> => {
  const result = await pool.query<Merchant>(
    'SELECT * FROM merchants WHERE is_active = true ORDER BY created_at DESC'
  );
  return result.rows;
};
