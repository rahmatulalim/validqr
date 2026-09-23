import 'package:geolocator/geolocator.dart';

class LocationService {
  /// Fetches the current location if permissions are granted.
  /// Returns null if permissions are denied or location services are disabled.
  /// This enables the graceful degradation feature in Layer 3.
  Future<Position?> getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    try {
      // Test if location services are enabled.
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return null;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return null;
      }

      // Permissions are granted, return current location with a timeout
      // to avoid hanging the scan process.
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 3),
      );
    } catch (e) {
      // Any error (timeout, etc) returns null to trigger graceful degradation
      return null;
    }
  }
}
