import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  X,
  Navigation,
} from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useCivicData } from '../../context/CivicDataContext';
import type { IncidentReport } from '../../types/civic';
import { Badge } from '../common/Badge';
import {
  FALLBACK_TILE_URL,
  OSM_ATTRIBUTION,
  PRIMARY_TILE_ATTRIBUTION,
  PRIMARY_TILE_URL,
} from '../../services/mapTiles';

interface LiveMapScreenProps {
  selectedIncident: IncidentReport | null;
  onSelectIncident: (inc: IncidentReport | null) => void;
}

export const LiveMapScreen: React.FC<LiveMapScreenProps> = ({
  selectedIncident,
  onSelectIncident,
}) => {
  const { location } = useLocation();
  const { incidents, cctvFleet, weather, alerts, emergencies, traffic } = useCivicData();


  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileFallbackArmedRef = useRef(false);
  const tileErrorCountRef = useRef(0);
  const [tileNotice, setTileNotice] = useState<string | null>(null);

  // Layer toggle states
  const [showRadius, setShowRadius] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showCctv, setShowCctv] = useState(true);
  const [showWeather, setShowWeather] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.coords.lat, location.coords.lng],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const primaryTiles = L.tileLayer(PRIMARY_TILE_URL, {
        attribution: PRIMARY_TILE_ATTRIBUTION,
        maxZoom: 19,
      });

      primaryTiles.on('tileerror', () => {
        tileErrorCountRef.current += 1;
        if (tileFallbackArmedRef.current || tileErrorCountRef.current < 4) return;
        tileFallbackArmedRef.current = true;
        L.tileLayer(FALLBACK_TILE_URL, {
          attribution: OSM_ATTRIBUTION,
          maxZoom: 19,
        }).addTo(map);
        setTileNotice('Primary map tiles failed. Showing OpenStreetMap tiles instead.');
      });

      primaryTiles.addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      window.setTimeout(() => {
        map.invalidateSize();
      }, 120);
    } else {
      mapInstanceRef.current.setView([location.coords.lat, location.coords.lng], 14);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layersGroupRef.current = null;
        tileFallbackArmedRef.current = false;
        tileErrorCountRef.current = 0;
      }
    };
  }, []);

  // Update center when location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([location.coords.lat, location.coords.lng]);
    }
  }, [location.coords.lat, location.coords.lng]);

  // Redraw layers when state or toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const userLat = location.coords.lat;
    const userLng = location.coords.lng;

    // 1. User Location Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(234, 88, 12, 0.25); animation: citypulse-user-pulse 2s infinite;"></div>
          <div style="width: 16px; height: 16px; border-radius: 50%; background: #ea580c; border: 3px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker([userLat, userLng], { icon: userIcon });
    userMarker.bindTooltip(`<b>Your Anchor: ${location.area}</b><br/>District: ${location.district}`, {
      direction: 'top',
    });
    group.addLayer(userMarker);

    // 2. 2 km Safety Radius Circle
    if (showRadius) {
      const radiusCircle = L.circle([userLat, userLng], {
        radius: 2000, // 2 km in meters
        color: '#ea580c',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#ea580c',
        fillOpacity: 0.06,
      });
      radiusCircle.bindTooltip('2 km Safety Radius', { sticky: true });
      group.addLayer(radiusCircle);
    }

    // 3. Incidents Markers
    if (showIncidents) {
      incidents.forEach((inc) => {
        const isSelected = selectedIncident?.id === inc.id;
        const color =
          inc.severity === 'critical'
            ? '#e11d48'
            : inc.severity === 'high'
            ? '#ea580c'
            : '#f59e0b';

        const incIcon = L.divIcon({
          className: 'custom-incident-marker',
          html: `
            <div style="background-color: ${color}; width: ${isSelected ? '36px' : '30px'}; height: ${
            isSelected ? '36px' : '30px'
          }; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.25); cursor: pointer; transition: transform 0.2s;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([inc.coords.lat, inc.coords.lng], { icon: incIcon });
        marker.bindTooltip(
          `<b>${inc.category}</b><br/>Severity: ${inc.severity}<br/>Status: ${inc.status}`,
          { direction: 'top' }
        );
        marker.on('click', () => {
          onSelectIncident(inc);
        });
        group.addLayer(marker);
      });
    }

    // 4. CCTV Camera Markers
    if (showCctv) {
      cctvFleet.forEach((cam) => {
        const isOnline = cam.status === 'online';
        const camIcon = L.divIcon({
          className: 'custom-cctv-marker',
          html: `
            <div style="background-color: ${isOnline ? '#2563eb' : '#64748b'}; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); cursor: pointer;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const latest = cam.latestEvent
          ? `${cam.latestEvent.type} (${cam.latestEvent.severity})`
          : 'No recent event';
        const marker = L.marker([cam.coords.lat, cam.coords.lng], { icon: camIcon });
        marker.bindTooltip(
          `<b>${cam.name}</b><br/>ID: ${cam.cameraCode}<br/>Status: ${cam.status.toUpperCase()}<br/>Latest: ${latest}`,
          { direction: 'top' }
        );
        group.addLayer(marker);
      });
    }

    // 5. Traffic Congestion Vectors (backend simulated segments when available)
    if (showTraffic) {
      if (traffic?.segments?.length) {
        traffic.segments.forEach((seg) => {
          const color =
            seg.congestion >= 75 ? '#e11d48' : seg.congestion >= 55 ? '#ea580c' : '#f59e0b';
          const trafficLine = L.polyline(
            [
              [seg.latitude, seg.longitude],
              [seg.latitude + 0.0024, seg.longitude + 0.0018],
            ],
            { color, weight: 5, opacity: 0.75 }
          );
          trafficLine.bindTooltip(
            `${seg.road} · ${seg.congestionLevel} congestion (${seg.congestion}%) · delay ${seg.estimated_delay} min${seg.related_incident ? ` · related ${seg.related_incident}` : ''} · simulated`,
            { sticky: true }
          );
          group.addLayer(trafficLine);
        });
      } else {
        const trafficLine = L.polyline(
          [
            [userLat - 0.008, userLng + 0.006],
            [userLat - 0.004, userLng + 0.003],
            [userLat + 0.001, userLng + 0.001],
          ],
          {
            color: '#ea580c',
            weight: 5,
            opacity: 0.75,
          }
        );
        trafficLine.bindTooltip('Main Arterial Corridor · Simulated slowdown (no live traffic feed)', {
          sticky: true,
        });
        group.addLayer(trafficLine);
      }
    }

    alerts.forEach((alert) => {
      if (!alert.coords) return;
      const marker = L.circleMarker([alert.coords.lat, alert.coords.lng], {
        radius: 7,
        color: '#b45309',
        fillColor: '#f59e0b',
        fillOpacity: 0.85,
        weight: 2,
      });
      marker.bindTooltip(`Alert: ${alert.title}${alert.isSimulated ? ' · simulated' : ''}`, {
        direction: 'top',
      });
      group.addLayer(marker);
    });

    emergencies.forEach((report) => {
      if (!Number.isFinite(report.coords.lat) || !Number.isFinite(report.coords.lng)) return;
      const severity = String(report.severity || '').toLowerCase();
      const fillColor =
        severity === 'critical' ? '#e11d48' : severity === 'high' ? '#ea580c' : '#f43f5e';
      const marker = L.circleMarker([report.coords.lat, report.coords.lng], {
        radius: 8,
        color: '#9f1239',
        fillColor,
        fillOpacity: 0.9,
        weight: 2,
      });
      marker.bindTooltip(
        `Emergency: ${report.category}<br/>Severity: ${report.severity}<br/>Status: ${report.status}`,
        { direction: 'top' }
      );
      group.addLayer(marker);
    });

    // 6. Weather Hazard Polygon
    if (showWeather && weather && weather.precipitationMm > 0) {
      const weatherPolygon = L.polygon(
        [
          [userLat + 0.002, userLng - 0.004],
          [userLat + 0.008, userLng + 0.002],
          [userLat + 0.004, userLng + 0.008],
          [userLat - 0.001, userLng + 0.003],
        ],
        {
          color: '#3b82f6',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: '#3b82f6',
          fillOpacity: 0.12,
        }
      );
      weatherPolygon.bindTooltip('Localized Precipitation Band · 45mm/2hr Zone', { sticky: true });
      group.addLayer(weatherPolygon);
    }
  }, [
    location,
    incidents,
    cctvFleet,
    weather,
    alerts,
    emergencies,
    traffic,
    selectedIncident,
    showRadius,
    showIncidents,
    showTraffic,
    showCctv,
    showWeather,
  ]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.coords.lat, location.coords.lng], 14, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm flex flex-col md:flex-row">
      {/* Interactive Map Area */}
      <div className="relative flex-1 h-full w-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {tileNotice && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-400 max-w-sm rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] font-medium text-amber-900 shadow-sm">
            {tileNotice}
          </div>
        )}

        {/* Floating Layer Controls (Top Left) */}
        <div className="absolute top-4 left-4 z-400 bg-white/95 backdrop-blur-xs p-3 rounded-2xl shadow-md border border-slate-200/80 text-xs space-y-2 max-w-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-1 border-b border-slate-100">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>Civic Intelligence Layers</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showRadius}
                onChange={(e) => setShowRadius(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full border border-orange-600 bg-orange-100" />
                2 km Safety Radius
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                Civic Incidents ({incidents.length})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showTraffic}
                onChange={(e) => setShowTraffic(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Traffic Friction Corridors
                {traffic?.isSimulated ? ' (simulated)' : ''}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showCctv}
                onChange={(e) => setShowCctv(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                CCTV Sensor Nodes ({cctvFleet.length})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showWeather}
                onChange={(e) => setShowWeather(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Precipitation / Hazard Zones
              </span>
            </label>
          </div>
        </div>

        {/* Floating Quick Action: Center on User (Top Right) */}
        <div className="absolute top-4 right-4 z-400 flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            className="p-2.5 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 hover:text-orange-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Recenter on your civic anchor"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Incident Drawer / Side Card */}
      {selectedIncident && (
        <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200/90 p-5 overflow-y-auto max-h-[50vh] md:max-h-full shrink-0 shadow-lg md:shadow-none z-400">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 block">
                CIVIC SIGNAL DETAIL
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {selectedIncident.category}
              </h3>
            </div>
            <button
              onClick={() => onSelectIncident(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant={
                selectedIncident.severity === 'critical'
                  ? 'red'
                  : selectedIncident.severity === 'high'
                  ? 'orange'
                  : 'amber'
              }
              size="sm"
            >
              {selectedIncident.severity.toUpperCase()} SEVERITY
            </Badge>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {selectedIncident.status}
            </span>
          </div>

          {/* Structured Intelligence: WHAT, WHERE, WHEN, SEVERITY, POSSIBLE IMPACT, WHAT TO DO */}
          <div className="space-y-3 text-xs">
            {/* WHAT */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                WHAT HAPPENED
              </span>
              <p className="font-semibold text-slate-800">{selectedIncident.description}</p>
            </div>

            {/* WHERE */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                WHERE & DISTANCE
              </span>
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>{selectedIncident.locationName}</span>
                <span className="text-orange-600 font-bold">
                  {selectedIncident.distanceKm !== undefined ? `${selectedIncident.distanceKm} km away` : 'Nearby'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Hierarchy: {selectedIncident.hierarchy.area} → {selectedIncident.hierarchy.mandal} → {selectedIncident.hierarchy.district}
              </div>
            </div>

            {/* WHEN */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                WHEN
              </span>
              <p className="font-semibold text-slate-800">
                {selectedIncident.timestamp} ({new Date(selectedIncident.reportedAtIso).toLocaleTimeString()})
              </p>
            </div>

            {/* POSSIBLE IMPACT */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide block mb-0.5">
                POSSIBLE CIVIC IMPACT
              </span>
              <p className="font-semibold text-amber-950">{selectedIncident.possibleImpact}</p>
            </div>

            {/* WHAT TO DO */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide block mb-0.5">
                WHAT RESIDENTS SHOULD DO
              </span>
              <p className="font-semibold text-blue-950">{selectedIncident.whatToDo}</p>
            </div>

            {/* AUTHORITY ROUTING */}
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  AUTHORITY DISPATCH (SIMULATED)
                </span>
                <span className="text-[10px] font-bold text-orange-600">Simulated</span>
              </div>
              <p className="font-bold text-slate-800">
                {selectedIncident.authorityRouting.department}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedIncident.authorityRouting.actionGuidance}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
