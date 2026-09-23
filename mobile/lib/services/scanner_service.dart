import '../models/qr_payload.dart';

class ScannerService {
  /// Parses an EMVCo TLV QRIS string to extract core fields.
  /// 
  /// Throws FormatException if parsing fails or required fields are missing.
  QrPayload parseQris(String payload) {
    if (payload.isEmpty) {
      throw const FormatException('QR payload is empty');
    }

    final tlv = _parseTlv(payload);

    final merchantName = tlv['59'] ?? '';
    final merchantCity = tlv['60'] ?? '';
    final postalCode = tlv['61'] ?? '';
    final additionalData = tlv['62'] ?? '';

    final nmid = _extractNmidFromTag62(additionalData);

    if (merchantName.isEmpty) {
      throw const FormatException('Missing Merchant Name (tag 59)');
    }
    if (nmid.isEmpty) {
      throw const FormatException('Missing NMID (tag 62 sub-tag 07)');
    }

    return QrPayload(
      nmid: nmid,
      merchantName: merchantName,
      merchantCity: merchantCity,
      postalCode: postalCode,
      rawPayload: payload,
    );
  }

  Map<String, String> _parseTlv(String payload) {
    final result = <String, String>{};
    int i = 0;

    while (i < payload.length) {
      if (i + 4 > payload.length) break;

      final tag = payload.substring(i, i + 2);
      final lengthStr = payload.substring(i + 2, i + 4);
      final length = int.tryParse(lengthStr) ?? 0;

      if (length <= 0 || i + 4 + length > payload.length) break;

      final value = payload.substring(i + 4, i + 4 + length);
      result[tag] = value;

      i += 4 + length;
    }

    return result;
  }

  String _extractNmidFromTag62(String additionalDataValue) {
    if (additionalDataValue.isEmpty) return '';
    final subtags = _parseTlv(additionalDataValue);
    return subtags['07'] ?? '';
  }
}
