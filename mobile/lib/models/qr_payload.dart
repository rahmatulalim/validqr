class QrPayload {
  final String nmid;
  final String merchantName;
  final String merchantCity;
  final String postalCode;
  final String rawPayload;

  QrPayload({
    required this.nmid,
    required this.merchantName,
    required this.merchantCity,
    required this.postalCode,
    required this.rawPayload,
  });

  Map<String, dynamic> toJson() {
    return {
      'nmid': nmid,
      'merchantName': merchantName,
      'merchantCity': merchantCity,
      'postalCode': postalCode,
      'rawPayload': rawPayload,
    };
  }
}
