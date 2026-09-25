export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  coordinates: Array<[number, number]>;
  distanceMeters: number;
  durationSeconds: number;
  provider: 'openrouteservice';
}

function readRoutingKey(): string {
  const key = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

export function isRoutingAvailable(): boolean {
  return readRoutingKey().length > 0;
}

/**
 * Optional future routing helper. Returns null when no key is configured
 * or when the provider is unreachable so the map can keep working.
 */
export async function getRoute(
  start: RoutePoint,
  destination: RoutePoint
): Promise<RouteResult | null> {
  const apiKey = readRoutingKey();
  if (!apiKey) {
    return null;
  }

  if (
    !Number.isFinite(start.lat) ||
    !Number.isFinite(start.lng) ||
    !Number.isFinite(destination.lat) ||
    !Number.isFinite(destination.lng)
  ) {
    return null;
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    start: `${start.lng},${start.lat}`,
    end: `${destination.lng},${destination.lat}`,
  });

  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?${params.toString()}`,
      { headers: { Accept: 'application/geo+json' } }
    );
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const feature = payload?.features?.[0];
    const geometry = feature?.geometry?.coordinates as number[][] | undefined;
    const summary = feature?.properties?.summary;

    if (!geometry?.length) {
      return null;
    }

    return {
      coordinates: geometry.map((pair) => [pair[1], pair[0]] as [number, number]),
      distanceMeters: Number(summary?.distance) || 0,
      durationSeconds: Number(summary?.duration) || 0,
      provider: 'openrouteservice',
    };
  } catch {
    return null;
  }
}
