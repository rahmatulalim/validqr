import dotenv from 'dotenv';
dotenv.config();

/**
 * Centralized environment configuration.
 * All env vars are read and typed here — never access process.env directly elsewhere.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  /** HTTP server port */
  port: parseInt(process.env.PORT || '3000', 10),

  /** Node environment: 'development' | 'production' | 'test' */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** PostgreSQL connection URL */
  get databaseUrl(): string {
    return requireEnv('DATABASE_URL');
  },

  /** Redis connection URL */
  get redisUrl(): string {
    return requireEnv('REDIS_URL');
  },

  /** WhatsApp Business API endpoint */
  waApiUrl: process.env.WA_API_URL || '',

  /** WhatsApp Business API Bearer token */
  waApiToken: process.env.WA_API_TOKEN || '',

  /**
   * Fuzzy warning threshold (0–100).
   * Scores below this value trigger SOFT_WARNING (YELLOW).
   * Default: 50 — calibrated so Stiker C lands in SOFT_WARNING range.
   */
  fuzzyWarningThreshold: parseInt(process.env.FUZZY_WARNING_THRESHOLD || '50', 10),

  /** Geofencing radius in meters */
  geofenceRadiusMeters: parseInt(process.env.GEOFENCE_RADIUS_METERS || '500', 10),
};

export type Config = typeof config;
