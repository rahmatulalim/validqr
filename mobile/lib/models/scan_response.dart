import '../core/state_machine.dart';

class ScanResponse {
  final ScanStatus status;
  final String color;
  final String message;
  final String? reason;
  final int? score;
  final double? distanceMeters;
  final bool? gpsChecked;
  final bool? degraded;

  ScanResponse({
    required this.status,
    required this.color,
    required this.message,
    this.reason,
    this.score,
    this.distanceMeters,
    this.gpsChecked,
    this.degraded,
  });

  factory ScanResponse.fromJson(Map<String, dynamic> json) {
    ScanStatus parsedStatus = ScanStatus.idle;
    switch (json['status']) {
      case 'VERIFIED':
        parsedStatus = ScanStatus.verified;
        break;
      case 'SOFT_WARNING':
        parsedStatus = ScanStatus.softWarning;
        break;
      case 'HARD_BLOCK':
        parsedStatus = ScanStatus.hardBlock;
        break;
    }

    return ScanResponse(
      status: parsedStatus,
      color: json['color'] ?? 'UNKNOWN',
      message: json['message'] ?? 'Tidak ada pesan',
      reason: json['reason'],
      score: json['score'] != null ? (json['score'] as num).toInt() : null,
      distanceMeters: json['distanceMeters'] != null
          ? (json['distanceMeters'] as num).toDouble()
          : null,
      gpsChecked: json['gpsChecked'],
      degraded: json['degraded'],
    );
  }
}
