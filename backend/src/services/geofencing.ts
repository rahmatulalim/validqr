import { Merchant } from './nmidValidator';

export interface GeofenceResult {
  inRange: boolean;
  distanceMeters: number;
  merchantLocation: { latitude: number; longitude: number };
}

/**
 * Convert degrees to radians.
 */
const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Calculate the great-circle distance between two GPS coordinates
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @returns Distance in meters
 */
export const haversineDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6_371_000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Check if a buyer's GPS coordinates fall within the registered geofence
 * of a merchant. Default radius: 500 meters (configurable via env).
 *
 * @param buyerLat Buyer's latitude
 * @param buyerLon Buyer's longitude
 * @param merchant Merchant record from database (contains lat/lon)
 * @param radiusMeters Geofence radius in meters (default: 500)
 * @returns GeofenceResult with distance and whether buyer is in range
 */
export const checkGeofence = (
  buyerLat: number,
  buyerLon: number,
  merchant: Merchant,
  radiusMeters: number = 500
): GeofenceResult => {
  const merchantLat = parseFloat(merchant.latitude.toString());
  const merchantLon = parseFloat(merchant.longitude.toString());

  const distanceMeters = haversineDistanceMeters(
    buyerLat,
    buyerLon,
    merchantLat,
    merchantLon
  );

  return {
    inRange: distanceMeters <= radiusMeters,
    distanceMeters: parseFloat(distanceMeters.toFixed(2)),
    merchantLocation: { latitude: merchantLat, longitude: merchantLon },
  };
};
