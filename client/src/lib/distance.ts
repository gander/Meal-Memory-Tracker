/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return distance;
}

/**
 * Format distance for display
 * @param distanceInMeters Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else if (distanceInMeters < 10000) {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  } else {
    return `${Math.round(distanceInMeters / 1000)}km`;
  }
}

/**
 * Calculate distance to restaurant and format for display
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param restaurantLat Restaurant's latitude
 * @param restaurantLon Restaurant's longitude
 * @returns Formatted distance string or null if coordinates are missing
 */
export function getDistanceToRestaurant(
  userLat: number | null,
  userLon: number | null,
  restaurantLat: number | string | null,
  restaurantLon: number | string | null
): { distance: number; formatted: string } | null {
  if (!userLat || !userLon || !restaurantLat || !restaurantLon) {
    return null;
  }

  const lat = typeof restaurantLat === 'string' ? parseFloat(restaurantLat) : restaurantLat;
  const lon = typeof restaurantLon === 'string' ? parseFloat(restaurantLon) : restaurantLon;

  if (isNaN(lat) || isNaN(lon)) {
    return null;
  }

  const distance = calculateDistance(userLat, userLon, lat, lon);
  return {
    distance,
    formatted: formatDistance(distance)
  };
}