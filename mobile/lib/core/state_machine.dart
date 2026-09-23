import 'package:flutter/foundation.dart';

/// Scan status as returned by the ValidQR API.
enum ScanStatus {
  /// Layer 1 + 2 + 3 all passed — transaction is safe
  verified,

  /// Layer 2 fuzzy score below threshold OR Layer 3 out of geofence range
  softWarning,

  /// Layer 1 NMID not found in database — transaction is blocked
  hardBlock,

  /// Currently scanning or loading
  loading,

  /// Initial state — no scan performed yet
  idle,
}

extension ScanStatusExtension on ScanStatus {
  String get displayName {
    switch (this) {
      case ScanStatus.verified:
        return 'VERIFIED';
      case ScanStatus.softWarning:
        return 'SOFT_WARNING';
      case ScanStatus.hardBlock:
        return 'HARD_BLOCK';
      case ScanStatus.loading:
        return 'LOADING';
      case ScanStatus.idle:
        return 'IDLE';
    }
  }

  bool get isTerminal =>
      this == ScanStatus.verified ||
      this == ScanStatus.softWarning ||
      this == ScanStatus.hardBlock;
}

/// State machine for the scan flow.
///
/// Manages transitions between scan states and ensures invalid
/// transitions are rejected (e.g., going from hardBlock to verified).
class ScanStateMachine extends ChangeNotifier {
  ScanStatus _state = ScanStatus.idle;
  String? _errorMessage;

  ScanStatus get state => _state;
  String? get errorMessage => _errorMessage;

  bool get isIdle => _state == ScanStatus.idle;
  bool get isLoading => _state == ScanStatus.loading;
  bool get isTerminal => _state.isTerminal;

  /// Valid state transitions:
  /// idle → loading
  /// loading → verified | softWarning | hardBlock
  /// terminal → idle (reset for next scan)
  bool _canTransition(ScanStatus from, ScanStatus to) {
    switch (from) {
      case ScanStatus.idle:
        return to == ScanStatus.loading;
      case ScanStatus.loading:
        return to == ScanStatus.verified ||
            to == ScanStatus.softWarning ||
            to == ScanStatus.hardBlock;
      case ScanStatus.verified:
      case ScanStatus.softWarning:
      case ScanStatus.hardBlock:
        return to == ScanStatus.idle; // Reset
      default:
        return false;
    }
  }

  void startScan() {
    if (_canTransition(_state, ScanStatus.loading)) {
      _state = ScanStatus.loading;
      _errorMessage = null;
      notifyListeners();
    }
  }

  void setResult(ScanStatus result) {
    if (_canTransition(_state, result)) {
      _state = result;
      notifyListeners();
    }
  }

  void reset() {
    _state = ScanStatus.idle;
    _errorMessage = null;
    notifyListeners();
  }

  void setError(String message) {
    _errorMessage = message;
    _state = ScanStatus.idle;
    notifyListeners();
  }
}
