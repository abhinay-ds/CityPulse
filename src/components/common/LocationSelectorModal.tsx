import React, { useEffect, useState } from 'react';
import { useLocation } from '../../context/LocationContext';
import { MapPin, Navigation, X, Check, Search, ShieldCheck, LoaderCircle } from 'lucide-react';
import type { CivicHierarchyLocation } from '../../types/civic';
import { GEOCODING_MIN_QUERY_LENGTH, searchLocations, type GeocodedLocation } from '../../services/geocodingApi';
import { civicLocationFromGeocode } from '../../services/locationService';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    location,
    status,
    error,
    requestBrowserLocation,
    setManualLocation,
    presets,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<GeocodedLocation[]>([]);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const query = searchQuery.trim();
    if (query.length < GEOCODING_MIN_QUERY_LENGTH) {
      setGeocodeResults([]);
      setGeocodeLoading(false);
      setGeocodeError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setGeocodeLoading(true);
      setGeocodeError(null);
      try {
        const results = await searchLocations(query, controller.signal);
        setGeocodeResults(results);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setGeocodeResults([]);
        setGeocodeError('Place search is temporarily unavailable. You can still pick a civic sector below.');
      } finally {
        setGeocodeLoading(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  const filteredPresets = presets.filter(
    (p) =>
      p.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mandal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPreset = (p: CivicHierarchyLocation) => {
    setManualLocation(p);
    onClose();
  };

  const handleSelectGeocode = (hit: GeocodedLocation) => {
    setManualLocation(civicLocationFromGeocode(hit));
    onClose();
  };

  const handleDetectGPS = async () => {
    await requestBrowserLocation();
    onClose();
  };

  const queryReady = searchQuery.trim().length >= GEOCODING_MIN_QUERY_LENGTH;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
              CIVIC GEOGRAPHY SECTOR
            </span>
            <h2 className="text-lg font-bold text-slate-900">Select Civic Location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-orange-900">Current Civic Anchor:</div>
                <div className="text-sm font-bold text-slate-900">{location.area}</div>
                <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="bg-white px-2 py-0.5 rounded border border-orange-200 text-[11px] font-medium text-slate-700">
                    Area: {location.area}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-orange-200 text-[11px] font-medium text-slate-700">
                    Mandal: {location.mandal}
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-orange-200 text-[11px] font-medium text-slate-700">
                    District: {location.district}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleDetectGPS}
              disabled={status === 'requesting'}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-sm"
            >
              <Navigation className={`w-4 h-4 ${status === 'requesting' ? 'animate-spin' : ''}`} />
              {status === 'requesting' ? 'Detecting browser coordinates...' : 'Use Precise Device GPS Location'}
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Only temporary coordinate lookup is used; exact coordinates are never stored to disk.</span>
            </div>
            {error && (
              <p className="text-xs text-rose-600 mt-1.5 px-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {error}
              </p>
            )}
          </div>

          <div className="pt-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Search places or select Area / Mandal / District
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, city, mandal, or district..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 px-1">
              Place lookup starts after {GEOCODING_MIN_QUERY_LENGTH} characters and is debounced.
            </p>
          </div>

          {queryReady && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Resolved places
              </div>
              {geocodeLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  Searching places…
                </div>
              )}
              {!geocodeLoading && geocodeError && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  {geocodeError}
                </p>
              )}
              {!geocodeLoading && !geocodeError && geocodeResults.length === 0 && (
                <p className="text-xs text-slate-500 px-1">No matching places. Try a nearby city name.</p>
              )}
              {!geocodeLoading &&
                geocodeResults.map((hit) => (
                  <button
                    key={`${hit.name}-${hit.latitude}-${hit.longitude}`}
                    onClick={() => handleSelectGeocode(hit)}
                    className="w-full text-left p-3 rounded-xl border bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all"
                  >
                    <div className="text-sm font-semibold text-slate-900">{hit.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {[hit.admin2, hit.admin1, hit.country].filter(Boolean).join(' · ') || 'Resolved coordinates'}
                    </div>
                  </button>
                ))}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Civic sectors (Area → Mandal → District)
            </div>
            {filteredPresets.length === 0 && (
              <p className="text-xs text-slate-500 px-1">No matching civic sectors in the local list.</p>
            )}
            {filteredPresets.map((preset, idx) => {
              const isSelected =
                preset.area === location.area && preset.mandal === location.mandal;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-orange-50/80 border-orange-300 ring-1 ring-orange-400'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{preset.area}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {preset.mandal} · {preset.district} ({preset.state})
                    </div>
                  </div>
                  {isSelected && (
                    <div className="p-1 rounded-full bg-orange-600 text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
