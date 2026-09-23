import { createClient, RedisClientType } from 'redis';
import { config } from './env';

/**
 * Redis client instance.
 * Used for spatial caching of merchant geolocation data.
 */
export let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  redisClient = createClient({ url: config.redisUrl }) as RedisClientType;

  redisClient.on('error', (err: Error) => {
    console.error('[Redis] Client error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully.');
  });

  try {
    await redisClient.connect();
  } catch (err) {
    const error = err as Error;
    console.error('[Redis] Failed to connect:', error.message);
    // Non-fatal — system will fall back to DB queries if Redis is unavailable
  }
};

/**
 * Get a value from Redis cache.
 * Returns null if key not found or Redis is unavailable.
 */
export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
};

/**
 * Set a value in Redis cache with TTL.
 * @param key Cache key
 * @param value JSON-serializable value
 * @param ttlSeconds Time to live in seconds
 */
export const cacheSet = async (key: string, value: string, ttlSeconds: number = 300): Promise<void> => {
  try {
    await redisClient.set(key, value, { EX: ttlSeconds });
  } catch {
    // Silently fail — cache miss is handled gracefully
  }
};
