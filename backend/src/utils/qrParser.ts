/**
 * EMVCo TLV Parser for QRIS payloads.
 *
 * Parses a QRIS string (EMVCo QR Code Specification for Payment Systems v1.1)
 * and extracts key fields needed for fraud detection:
 *  - Merchant Name (tag 59)
 *  - Merchant City (tag 60)
 *  - Postal Code (tag 61)
 *  - NMID (tag 62, sub-tag 07)
 *
 * TLV format: [Tag: 2 chars][Length: 2 chars][Value: N chars]
 * Nested TLV: tags 26-51 and 62 contain nested TLV structures.
 */

export interface ParsedQRIS {
  /** National Merchant ID — extracted from tag 62 sub-tag 07 */
  nmid: string;
  /** Merchant name as registered — tag 59 */
  merchantName: string;
  /** Merchant city — tag 60 */
  merchantCity: string;
  /** Postal code — tag 61 */
  postalCode: string;
  /** Full raw payload string */
  rawPayload: string;
  /** CRC from tag 63 */
  crc: string;
}

/**
 * Walk through a TLV-encoded string and return a map of tag → value.
 * Handles only flat TLV (non-nested). For nested tags, call recursively.
 */
const parseTLV = (payload: string): Map<string, string> => {
  const result = new Map<string, string>();
  let i = 0;

  while (i < payload.length) {
    if (i + 4 > payload.length) break;

    const tag = payload.substring(i, i + 2);
    const lengthStr = payload.substring(i + 2, i + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length)) break;

    const value = payload.substring(i + 4, i + 4 + length);
    result.set(tag, value);

    i += 4 + length;
  }

  return result;
};

/**
 * Extract NMID from tag 62 (Additional Data Field) sub-tag 07 (Reference Label).
 * In QRIS spec, sub-tag 07 under tag 62 is used to store the NMID.
 *
 * @param additionalDataValue The value portion of tag 62
 */
const extractNmidFromTag62 = (additionalDataValue: string): string => {
  const subtags = parseTLV(additionalDataValue);
  // Sub-tag 07 = Reference Label (NMID in QRIS)
  return subtags.get('07') || '';
};

/**
 * Parse a QRIS payload string into structured fields.
 *
 * @param payload Full QRIS payload string (EMVCo TLV format)
 * @returns ParsedQRIS object with extracted fields
 * @throws Error if required fields (59, 62) are missing
 */
export const parseQRIS = (payload: string): ParsedQRIS => {
  if (!payload || payload.trim().length === 0) {
    throw new Error('QR payload is empty or null');
  }

  const tlv = parseTLV(payload);

  // Extract core fields
  const merchantName = tlv.get('59') || '';
  const merchantCity = tlv.get('60') || '';
  const postalCode = tlv.get('61') || '';
  const crc = tlv.get('63') || '';
  const additionalData = tlv.get('62') || '';

  const nmid = extractNmidFromTag62(additionalData);

  if (!merchantName) {
    throw new Error('Missing required field: Merchant Name (tag 59)');
  }

  if (!nmid) {
    throw new Error('Missing required field: NMID (tag 62 sub-tag 07)');
  }

  return {
    nmid,
    merchantName,
    merchantCity,
    postalCode,
    rawPayload: payload,
    crc,
  };
};
