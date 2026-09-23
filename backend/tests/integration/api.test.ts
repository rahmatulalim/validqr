/**
 * Integration tests for ValidQR API.
 *
 * These tests use supertest to make real HTTP requests to the Express app.
 * They mock database and Redis dependencies but test the full request/response cycle.
 *
 * Run with: npm run test:integration
 */

// Mock external dependencies before importing app
jest.mock('../src/config/db', () => ({
  pool: {
    query: jest.fn(),
  },
  testDbConnection: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/config/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue(undefined),
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  redisClient: {},
}));

jest.mock('../src/services/whatsappBot', () => ({
  sendFraudAlert: jest.fn().mockResolvedValue(true),
}));

import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/db';

const mockPool = pool as jest.Mocked<typeof pool>;

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

describe('ValidQR API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Health Check ────────────────────────────────────────────────────────
  describe('GET /health', () => {
    it('should return 200 with ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBe('1.0.0');
    });
  });

  // ── POST /api/v1/verify/scan ─────────────────────────────────────────────
  describe('POST /api/v1/verify/scan', () => {
    it('Sticker A — should return VERIFIED (GREEN) for valid merchant', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [MOCK_MERCHANT] }) // nmidValidator DB query
        .mockResolvedValueOnce({ rows: [] }); // incident log insert

      const res = await request(app)
        .post('/api/v1/verify/scan')
        .send({
          nmid: 'ID10293847561',
          merchantName: 'Warung Bakso Pak Budi',
          latitude: -6.8915,
          longitude: 107.6107,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('VERIFIED');
      expect(res.body.color).toBe('GREEN');
      expect(res.body.score).toBe(100);
    });

    it('Sticker B — should return HARD_BLOCK (RED) for unknown NMID', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // nmidValidator — not found
        .mockResolvedValueOnce({ rows: [{ wa_number: '6281234567890' }] }) // whatsapp lookup
        .mockResolvedValueOnce({ rows: [] }); // incident log insert

      const res = await request(app)
        .post('/api/v1/verify/scan')
        .send({
          nmid: 'ID99999999980',
          merchantName: 'Toko Aksesoris Penipu',
          latitude: -6.8915,
          longitude: 107.6107,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('HARD_BLOCK');
      expect(res.body.color).toBe('RED');
      expect(res.body.reason).toBe('NMID_MISMATCH');
    });

    it('Sticker C — should return SOFT_WARNING (YELLOW) for rebrand merchant', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [MOCK_MERCHANT] }) // nmidValidator DB query
        .mockResolvedValueOnce({ rows: [] }); // incident log insert

      const res = await request(app)
        .post('/api/v1/verify/scan')
        .send({
          nmid: 'ID10293847561',
          merchantName: 'Bakso Budi Dipatiukur',
          latitude: -6.8915,
          longitude: 107.6107,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('SOFT_WARNING');
      expect(res.body.color).toBe('YELLOW');
      expect(res.body.score).toBeLessThan(50);
    });

    it('should return VERIFIED with degraded flag when GPS is missing', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [MOCK_MERCHANT] }) // nmidValidator
        .mockResolvedValueOnce({ rows: [] }); // incident log

      const res = await request(app)
        .post('/api/v1/verify/scan')
        .send({
          nmid: 'ID10293847561',
          merchantName: 'Warung Bakso Pak Budi',
          // No latitude/longitude
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('VERIFIED');
      expect(res.body.degraded).toBe(true);
      expect(res.body.gpsChecked).toBe(false);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/verify/scan')
        .send({ nmid: 'ID10293847561' }); // missing merchantName

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BAD_REQUEST');
    });
  });

  // ── POST /api/v1/notify/fraud-alert ─────────────────────────────────────
  describe('POST /api/v1/notify/fraud-alert', () => {
    it('should return success when alert is sent', async () => {
      const res = await request(app)
        .post('/api/v1/notify/fraud-alert')
        .send({
          nmid: 'ID99999999980',
          suspectedMerchantName: 'Toko Aksesoris Penipu',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/notify/fraud-alert')
        .send({ nmid: 'ID99999999980' }); // missing suspectedMerchantName

      expect(res.status).toBe(400);
    });
  });
});
