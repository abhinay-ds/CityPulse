import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { CivicHierarchyLocation, GeoCoordinates } from '../types/civic';
import {
  CIVIC_HIERARCHY_PRESETS,
  calculateDistanceKm,
  reverseGeocodeCoordinates,
} from '../services/locationService';

interface LocationContextType {
  location: CivicHierarchyLocation;
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'fallback';
  error: string | null;
  requestBrowserLocation: () => Promise<void>;
  setManualLocation: (loc: CivicHierarchyLocation) => void;
  calculateDistanceTo: (coords: GeoCoordinates) => number;
  presets: CivicHierarchyLocation[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 60000,
};

const MOVE_THRESHOLD_KM = 0.15;

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<CivicHierarchyLocation>(CIVIC_HIERARCHY_PRESETS[0]);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'fallback'>('idle');
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastResolvedRef = useRef<GeoCoordinates | null>(null);
  const requestedOnceRef = useRef(false);
  const applySeqRef = useRef(0);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const applyBrowserPosition = useCallback(async (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    if (lastResolvedRef.current) {
      const moved = calculateDistanceKm(lastResolvedRef.current, { lat, lng });
      if (moved < MOVE_THRESHOLD_KM) {
        return;
      }
    }
    lastResolvedRef.current = { lat, lng };
    const seq = ++applySeqRef.current;

    try {
      const resolved = await reverseGeocodeCoordinates(lat, lng);
      if (seq !== applySeqRef.current) return;
      setLocation(resolved);
      setStatus('granted');
      setError(null);
    } catch (err: unknown) {
      if (seq !== applySeqRef.current) return;
      console.warn('Reverse geocoding error:', err);
      setLocation({
        area: `Locality (${lat.toFixed(2)}N, ${lng.toFixed(2)}E)`,
        mandal: 'Civic Mandal',
        district: 'Metropolitan District',
        state: 'Regional State',
        formattedAddress: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        coords: { lat, lng },
      });
      setStatus('granted');
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current != null) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        void applyBrowserPosition(pos);
      },
      () => {
        // Keep the last granted location; do not re-prompt.
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000,
      }
    );
  }, [applyBrowserPosition]);

  const requestBrowserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus('fallback');
      setError('Browser geolocation is not supported on this device.');
      return;
    }

    setStatus('requesting');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await applyBrowserPosition(pos);
        startWatching();
      },
      (geoError) => {
        console.warn('Geolocation permission error:', geoError.message);
        stopWatching();
        setStatus('denied');
        setError('Location access was denied or timed out. Switched to manual civic sector fallback.');
      },
      GEO_OPTIONS
    );
  }, [applyBrowserPosition, startWatching, stopWatching]);

  useEffect(() => {
    if (!requestedOnceRef.current) {
      requestedOnceRef.current = true;
      void requestBrowserLocation();
    }
    return () => {
      stopWatching();
    };
  }, [requestBrowserLocation, stopWatching]);

  const setManualLocation = useCallback(
    (newLoc: CivicHierarchyLocation) => {
      stopWatching();
      lastResolvedRef.current = newLoc.coords;
      setLocation(newLoc);
      setStatus('fallback');
      setError(null);
    },
    [stopWatching]
  );

  const calculateDistanceTo = useCallback(
    (coords: GeoCoordinates) => {
      return calculateDistanceKm(location.coords, coords);
    },
    [location.coords]
  );

  return (
    <LocationContext.Provider
      value={{
        location,
        status,
        error,
        requestBrowserLocation,
        setManualLocation,
        calculateDistanceTo,
        presets: CIVIC_HIERARCHY_PRESETS,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
