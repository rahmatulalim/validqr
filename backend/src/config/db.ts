import { Pool } from 'pg';
import { config } from './env';

/**
 * PostgreSQL connection pool.
 * Shared across all services — do not create new Pool instances elsewhere.
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

/**
 * Test the database connection on startup.
 * Logs success or failure — does not crash the server.
 */
export const testDbConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[DB] PostgreSQL connected successfully.');
  } catch (err) {
    const error = err as Error;
    console.error('[DB] Failed to connect to PostgreSQL:', error.message);
  }
};
