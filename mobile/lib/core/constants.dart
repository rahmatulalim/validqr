/// Application-level constants for NusaPay / ValidQR SDK.
///
/// IMPORTANT: Update [apiBaseUrl] after running ngrok for HackNusa demo.
library;

class AppConstants {
  AppConstants._();

  // ── API Configuration ──────────────────────────────────────────────────
  /// Base URL for the ValidQR backend API.
  /// Update this to your ngrok/localtunnel URL before the demo.
  static const String apiBaseUrl = 'http://10.0.2.2:3000';
  // For physical device via ngrok: 'https://xxxx.ngrok.io'
  // For local emulator: 'http://10.0.2.2:3000'

  static const String apiVersion = 'v1';
  static const String scanEndpoint = '/api/$apiVersion/verify/scan';
  static const Duration apiTimeout = Duration(seconds: 10);

  // ── Geofencing ────────────────────────────────────────────────────────
  /// Geofence radius in meters (must match backend GEOFENCE_RADIUS_METERS)
  static const double geofenceRadiusMeters = 500.0;

  // ── Fuzzy Matching ────────────────────────────────────────────────────
  /// Warning threshold percentage (must match backend FUZZY_WARNING_THRESHOLD)
  static const int fuzzyWarningThreshold = 50;

  // ── Demo Sticker NMIDs ────────────────────────────────────────────────
  static const String stickerANmid = 'ID10293847561';
  static const String stickerBNmid = 'ID99999999980';
  static const String stickerCNmid = 'ID10293847561'; // Same as A — intentional

  // ── UI Strings (Bahasa Indonesia) ─────────────────────────────────────
  static const String appName = 'NusaPay';
  static const String scanPageTitle = 'Scan QRIS';
  static const String scanHint = 'Arahkan kamera ke kode QRIS';
  static const String resultSafe = 'Transaksi Aman';
  static const String resultWarning = 'Konfirmasi Diperlukan';
  static const String resultBlocked = 'Transaksi Diblokir';
  static const String continuePayment = 'Lanjutkan Pembayaran';
  static const String cancelPayment = 'Batalkan';
  static const String scanAgain = 'Scan Ulang';
  static const String historyTitle = 'Riwayat Scan';
}
