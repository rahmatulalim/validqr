/**
 * CRC-16/CCITT-FALSE checksum implementation.
 *
 * Used for computing the CRC checksum appended to QRIS payloads (tag 63).
 * Algorithm parameters:
 *   - Polynomial:     0x1021
 *   - Initial value:  0xFFFF
 *   - Input reflect:  false
 *   - Output reflect: false
 *   - Final XOR:      0x0000
 *
 * @see https://crccalc.com/ — verify with "CRC-16/CCITT-FALSE"
 */
export const crc16ccittFalse = (data: string): string => {
  let crc = 0xFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000)
        ? ((crc << 1) ^ 0x1021) & 0xFFFF
        : (crc << 1) & 0xFFFF;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Verify CRC-16 checksum of a full QRIS payload string.
 * The payload must end with "63" + "04" + 4-char CRC.
 *
 * @param fullPayload The complete QRIS payload string including CRC tag
 * @returns true if CRC is valid
 */
export const verifyQrisCrc = (fullPayload: string): boolean => {
  // CRC is always tag 63, length 04, value = last 4 chars
  const crcTagIndex = fullPayload.lastIndexOf('6304');
  if (crcTagIndex === -1) return false;

  const dataToCheck = fullPayload.substring(0, crcTagIndex + 4); // up to and including "6304"
  const embeddedCrc = fullPayload.substring(crcTagIndex + 4);
  const computedCrc = crc16ccittFalse(dataToCheck);

  return computedCrc === embeddedCrc.toUpperCase();
};
