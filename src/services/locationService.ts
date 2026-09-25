import type { CivicHierarchyLocation, GeoCoordinates } from '../types/civic';
import type { GeocodedLocation } from './geocodingApi';
import { getApiBaseUrl } from './apiClient';

// Known civic hierarchy hubs for resilient fallback selection
export const CIVIC_HIERARCHY_PRESETS: CivicHierarchyLocation[] = [
  {
    area: 'Pune Central (FC Road & Shivajinagar)',
    mandal: 'Haveli Mandal',
    district: 'Pune District',
    state: 'Maharashtra',
    formattedAddress: 'Shivajinagar, Haveli, Pune, Maharashtra',
    coords: { lat: 18.5204, lng: 73.8567 },
  },
  {
    area: 'Kothrud & Karve Road',
    mandal: 'Haveli Mandal',
    district: 'Pune District',
    state: 'Maharashtra',
    formattedAddress: 'Kothrud, Haveli, Pune, Maharashtra',
    coords: { lat: 18.5074, lng: 73.8077 },
  },
  {
    area: 'Viman Nagar & Nagar Road',
    mandal: 'Haveli Mandal',
    district: 'Pune District',
    state: 'Maharashtra',
    formattedAddress: 'Viman Nagar, Haveli, Pune, Maharashtra',
    coords: { lat: 18.5679, lng: 73.9143 },
  },
  {
    area: 'Hinjawadi IT Park',
    mandal: 'Mulshi Mandal',
    district: 'Pune District',
    state: 'Maharashtra',
    formattedAddress: 'Hinjawadi Phase 1, Mulshi, Pune, Maharashtra',
    coords: { lat: 18.5913, lng: 73.7389 },
  },
  {
    area: 'Madhapur & HITEC City',
    mandal: 'Serilingampally Mandal',
    district: 'Hyderabad District',
    state: 'Telangana',
    formattedAddress: 'HITEC City, Serilingampally, Hyderabad, Telangana',
    coords: { lat: 17.4474, lng: 78.3762 },
  },
  {
    area: 'Indiranagar & 100ft Road',
    mandal: 'Bengaluru East Mandal',
    district: 'Bengaluru Urban District',
    state: 'Karnataka',
    formattedAddress: 'Indiranagar, Bengaluru East, Bengaluru, Karnataka',
    coords: { lat: 12.9784, lng: 77.6408 },
  },
  {
    area: 'Bandra West (Linking Road)',
    mandal: 'Andheri Mandal',
    district: 'Mumbai Suburban District',
    state: 'Maharashtra',
    formattedAddress: 'Bandra West, Mumbai Suburban, Maharashtra',
    coords: { lat: 19.0596, lng: 72.8295 },
  },
  {
    area: 'Connaught Place & Barakhamba',
    mandal: 'Chanakyapuri Mandal',
    district: 'New Delhi District',
    state: 'Delhi',
    formattedAddress: 'Connaught Place, New Delhi, Delhi',
    coords: { lat: 28.6315, lng: 77.2167 },
  },
];

/** Map Open-Meteo search hits onto CityPulse Area → Mandal → District. */
export function civicLocationFromGeocode(result: GeocodedLocation): CivicHierarchyLocation {
  const area = result.name;
  const mandal = result.admin2 || 'Civic Mandal';
  const district = result.admin2
    ? `${result.admin2} District`
    : result.admin1
      ? `${result.admin1} District`
      : 'Civic District';
  const state = result.admin1 || result.country || 'Local State';
  const parts = [area, result.admin2, result.admin1, result.country].filter(Boolean);

  return {
    area,
    mandal,
    district,
    state,
    formattedAddress: parts.join(', '),
    coords: { lat: result.latitude, lng: result.longitude },
    isCustom: true,
  };
}

// Haversine formula to compute distance in kilometers
export function calculateDistanceKm(
  coord1: GeoCoordinates,
  coord2: GeoCoordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Reverse geocode latitude and longitude to Civic Hierarchy: Area -> Mandal -> District
 * Uses public OpenStreetMap Nominatim with safe timeouts and parsing.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<CivicHierarchyLocation> {
  const apiBase = getApiBaseUrl();
  try {
    const backendRes = await fetch(`${apiBase}/api/v1/location/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });
    if (backendRes.ok) {
      const resolved = await backendRes.json();
      return {
        area: resolved.area,
        mandal: resolved.mandal,
        district: resolved.district,
        state: resolved.state,
        formattedAddress: resolved.display_name,
        coords: { lat, lng },
      };
    }
  } catch {
    // Fall through to the existing Nominatim client implementation.
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CityPulse-CivicPlatform/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Geocoding HTTP error: ${res.status}`);
    }

    const data = await res.json();
    const addr = data.address || {};

    const area =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.quarter ||
      addr.commercial ||
      addr.road ||
      `Sector near (${lat.toFixed(3)}, ${lng.toFixed(3)})`;

    const mandal =
      addr.county ||
      addr.municipality ||
      addr.subdistrict ||
      addr.borough ||
      'Central Mandal';

    const district =
      addr.state_district ||
      addr.city ||
      addr.district ||
      addr.town ||
      'Civic District';

    const state = addr.state || 'Local State';

    return {
      area,
      mandal,
      district,
      state,
      formattedAddress: data.display_name || `${area}, ${mandal}, ${district}`,
      coords: { lat, lng },
    };
  } catch {
    clearTimeout(timeoutId);
    // Find closest preset or synthesize clean label
    const closest = CIVIC_HIERARCHY_PRESETS.reduce((prev, curr) => {
      const prevDist = calculateDistanceKm({ lat, lng }, prev.coords);
      const currDist = calculateDistanceKm({ lat, lng }, curr.coords);
      return currDist < prevDist ? curr : prev;
    }, CIVIC_HIERARCHY_PRESETS[0]);

    const distFromPreset = calculateDistanceKm({ lat, lng }, closest.coords);
    if (distFromPreset < 15) {
      return {
        ...closest,
        coords: { lat, lng },
      };
    }

    return {
      area: `Locality (${lat.toFixed(3)}N, ${lng.toFixed(3)}E)`,
      mandal: `${closest.mandal}`,
      district: `${closest.district}`,
      state: closest.state,
      formattedAddress: `Civic Sector at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      coords: { lat, lng },
    };
  }
}
