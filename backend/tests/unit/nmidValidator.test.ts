/**
 * Unit tests for NMID validator.
 * Uses mocked PostgreSQL and Redis to avoid real DB dependency.
 */

// Mock database and redis before importing the module
jest.mock('../../src/config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('../../src/config/redis', () => ({
  cacheGet: jest.fn(),
  cacheSet: jest.fn(),
}));

import { pool } from '../../src/config/db';
import { cacheGet, cacheSet } from '../../src/config/redis';
import { validateNMID } from '../../src/services/nmidValidator';

const mockPool = pool as jest.Mocked<typeof pool>;
const mockCacheGet = cacheGet as jest.MockedFunction<typeof cacheGet>;
const mockCacheSet = cacheSet as jest.MockedFunction<typeof cacheSet>;

const MOCK_MERCHANT = {
  id: 1,
  nmid: 'ID10293847561',
  name: 'Warung Bakso Pak Budi',
  latitude: -6.8915,
  longitude: 107.6107,
  wa_number: '6281234567890',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('nmidValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateNMID', () => {
    it('should return valid=true with merchant data for registered NMID (Sticker A)', async () => {
      mockCacheGet.mockResolvedValue(null); // cache miss
      mockPool.query = jest.fn().mockResolvedValue({ rows: [MOCK_MERCHANT] });
      mockCacheSet.mockResolvedValue(undefined);

      const result = await validateNMID('ID10293847561');

      expect(result.valid).toBe(true);
      expect(result.merchant).toBeDefined();
      expect(result.merchant?.nmid).toBe('ID10293847561');
      expect(result.merchant?.name).toBe('Warung Bakso Pak Budi');
    });

    it('should return valid=false for unregistered NMID (Sticker B — penipu)', async () => {
      mockCacheGet.mockResolvedValue(null); // cache miss
      mockPool.query = jest.fn().mockResolvedValue({ rows: [] }); // not found

      const result = await validateNMID('ID99999999980');

      expect(result.valid).toBe(false);
      expect(result.merchant).toBeUndefined();
    });

    it('should use Redis cache on cache hit', async () => {
      mockCacheGet.mockResolvedValue(JSON.stringify(MOCK_MERCHANT));

      const result = await validateNMID('ID10293847561');

      expect(result.valid).toBe(true);
      expect(result.merchant?.nmid).toBe('ID10293847561');
      // DB should NOT be queried when cache hits
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should cache result in Redis after DB query', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockPool.query = jest.fn().mockResolvedValue({ rows: [MOCK_MERCHANT] });
      mockCacheSet.mockResolvedValue(undefined);

      await validateNMID('ID10293847561');

      expect(mockCacheSet).toHaveBeenCalledWith(
        'merchant:ID10293847561',
        JSON.stringify(MOCK_MERCHANT),
        300
      );
    });

    it('should not cache when NMID is not found', async () => {
      mockCacheGet.mockResolvedValue(null);
      mockPool.query = jest.fn().mockResolvedValue({ rows: [] });

      await validateNMID('ID99999999999');

      expect(mockCacheSet).not.toHaveBeenCalled();
    });
  });
});
