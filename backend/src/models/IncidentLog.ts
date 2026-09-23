import { pool } from '../config/db';

/**
 * IncidentLog entity — mirrors the incident_logs PostgreSQL table.
 */
export interface IncidentLogEntry {
  nmid_scanned: string;
  merchant_name?: string;
  status: 'VERIFIED' | 'SOFT_WARNING' | 'HARD_BLOCK';
  color: 'GREEN' | 'YELLOW' | 'RED';
  reason?: string;
  fuzzy_score?: number;
  latitude?: number;
  longitude?: number;
  distance_meters?: number;
  gps_available?: boolean;
  raw_payload?: string;
}

/**
 * Insert a scan incident record into the incident_logs table.
 * This is called for every scan — successful or fraudulent — to maintain
 * a complete audit trail.
 *
 * @param entry IncidentLogEntry to insert
 */
export const logIncident = async (entry: IncidentLogEntry): Promise<void> => {
  try {
    await pool.query(
      `INSERT INTO incident_logs 
        (nmid_scanned, merchant_name, status, color, reason, fuzzy_score, 
         latitude, longitude, distance_meters, gps_available, raw_payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        entry.nmid_scanned,
        entry.merchant_name ?? null,
        entry.status,
        entry.color,
        entry.reason ?? null,
        entry.fuzzy_score ?? null,
        entry.latitude ?? null,
        entry.longitude ?? null,
        entry.distance_meters ?? null,
        entry.gps_available ?? null,
        entry.raw_payload ?? null,
      ]
    );
  } catch (err) {
    // Non-fatal — log the error but don't crash the request
    console.error('[IncidentLog] Failed to write incident log:', (err as Error).message);
  }
};
