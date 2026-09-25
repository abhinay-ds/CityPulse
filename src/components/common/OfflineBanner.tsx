import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, weatherError, usingBackend } = useCivicData();

  if (!isOffline && !weatherError && usingBackend) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b border-amber-600/30">
      {isOffline || !usingBackend ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0 text-amber-950" />
          <span>
            {isOffline
              ? 'Offline Mode active. Displaying cached civic telemetry and local safety protocols.'
              : 'CityPulse API unavailable. Showing local demo civic data until the backend is reachable.'}
          </span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950" />
          <span>{weatherError}</span>
        </>
      )}
    </div>
  );
};
