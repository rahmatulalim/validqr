import { parseQRIS } from '../../src/utils/qrParser';
import { crc16ccittFalse, verifyQrisCrc } from '../../src/utils/crc16';

/**
 * Build a TLV-encoded string segment.
 */
const buildTlv = (tag: string, value: string): string =>
  `${tag}${value.length.toString().padStart(2, '0')}${value}`;

/**
 * Build a minimal QRIS-like payload for testing.
 * Uses the same TLV structure as the real sticker generator.
 */
const buildTestPayload = (nmid: string, name: string, city: string, postal: string): string => {
  const additionalData = buildTlv('07', nmid);
  const payload =
    buildTlv('00', '01') +
    buildTlv('01', '11') +
    buildTlv('59', name) +
    buildTlv('60', city) +
    buildTlv('61', postal) +
    buildTlv('62', additionalData);

  const withCrcPlaceholder = payload + '6304';
  const crc = crc16ccittFalse(withCrcPlaceholder);
  return withCrcPlaceholder + crc;
};

describe('qrParser — EMVCo TLV parsing', () => {
  describe('parseQRIS', () => {
    it('should correctly parse merchant name from tag 59', () => {
      const payload = buildTestPayload('ID10293847561', 'Warung Bakso Pak Budi', 'Bandung', '40123');
      const parsed = parseQRIS(payload);
      expect(parsed.merchantName).toBe('Warung Bakso Pak Budi');
    });

    it('should correctly parse NMID from tag 62 sub-tag 07', () => {
      const payload = buildTestPayload('ID10293847561', 'Warung Bakso Pak Budi', 'Bandung', '40123');
      const parsed = parseQRIS(payload);
      expect(parsed.nmid).toBe('ID10293847561');
    });

    it('should correctly parse merchant city from tag 60', () => {
      const payload = buildTestPayload('ID10293847561', 'Warung Bakso Pak Budi', 'Bandung', '40123');
      const parsed = parseQRIS(payload);
      expect(parsed.merchantCity).toBe('Bandung');
    });

    it('should correctly parse postal code from tag 61', () => {
      const payload = buildTestPayload('ID10293847561', 'Warung Bakso Pak Budi', 'Bandung', '40123');
      const parsed = parseQRIS(payload);
      expect(parsed.postalCode).toBe('40123');
    });

    it('should parse Sticker C with same NMID as A but different name', () => {
      const payload = buildTestPayload('ID10293847561', 'Bakso Budi Dipatiukur', 'Bandung', '40123');
      const parsed = parseQRIS(payload);
      expect(parsed.nmid).toBe('ID10293847561');
      expect(parsed.merchantName).toBe('Bakso Budi Dipatiukur');
    });

    it('should parse Sticker B with penipu NMID', () => {
      const payload = buildTestPayload('ID99999999980', 'Toko Aksesoris Penipu', 'Bandung', '40123');
      const parsed = parseQRIS(payload);
      expect(parsed.nmid).toBe('ID99999999980');
    });

    it('should throw an error for empty payload', () => {
      expect(() => parseQRIS('')).toThrow('QR payload is empty or null');
    });
  });
});

describe('crc16ccittFalse', () => {
  it('should produce a 4-character uppercase hex string', () => {
    const crc = crc16ccittFalse('000201010211');
    expect(crc).toHaveLength(4);
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
  });

  it('should produce consistent results for the same input', () => {
    const input = '000201010211590014Warung Bakso6304';
    expect(crc16ccittFalse(input)).toBe(crc16ccittFalse(input));
  });

  it('should produce different CRCs for different inputs', () => {
    const crc1 = crc16ccittFalse('data1');
    const crc2 = crc16ccittFalse('data2');
    expect(crc1).not.toBe(crc2);
  });

  it('should verify CRC in a test payload', () => {
    const payload = buildTestPayload('ID10293847561', 'Warung Bakso Pak Budi', 'Bandung', '40123');
    expect(verifyQrisCrc(payload)).toBe(true);
  });

  it('should fail CRC verification for tampered payload', () => {
    const payload = buildTestPayload('ID10293847561', 'Warung Bakso Pak Budi', 'Bandung', '40123');
    const tampered = payload.slice(0, -4) + '0000'; // Replace CRC with 0000
    expect(verifyQrisCrc(tampered)).toBe(false);
  });
});
