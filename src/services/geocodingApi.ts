export interface GeocodedLocation {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1: string;
  admin2: string;
  timezone: string;
}

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
export const GEOCODING_MIN_QUERY_LENGTH = 3;

interface OpenMeteoGeocodingResult {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
}

interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoGeocodingResult[];
}

function normalizeResult(item: OpenMeteoGeocodingResult): GeocodedLocation | null {
  if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
    return null;
  }
  return {
    name: item.name?.trim() || 'Unnamed locality',
    latitude: item.latitude as number,
    longitude: item.longitude as number,
    country: item.country?.trim() || '',
    admin1: item.admin1?.trim() || '',
    admin2: item.admin2?.trim() || '',
    timezone: item.timezone?.trim() || '',
  };
}

/**
 * Forward geocode a place name via Open-Meteo (no API key).
 * Callers must debounce and enforce a minimum query length.
 */
export async function searchLocations(
  query: string,
  signal?: AbortSignal
): Promise<GeocodedLocation[]> {
  const name = query.trim();
  if (name.length < GEOCODING_MIN_QUERY_LENGTH) {
    return [];
  }

  const params = new URLSearchParams({
    name,
    count: '5',
    language: 'en',
    format: 'json',
  });

  const response = await fetch(`${GEOCODING_ENDPOINT}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed (${response.status})`);
  }

  const payload = (await response.json()) as OpenMeteoGeocodingResponse;
  if (!payload.results?.length) {
    return [];
  }

  return payload.results
    .map(normalizeResult)
    .filter((item): item is GeocodedLocation => item !== null);
}
