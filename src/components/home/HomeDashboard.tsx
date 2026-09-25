import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Camera,
  CloudRain,
  ChevronRight,
  Siren,
  MapPin,
  Newspaper,
  ArrowRight,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useLocation } from '../../context/LocationContext';
import { AiInsightCard } from './AiInsightCard';
import { PulseScoreIndicator } from '../common/PulseScoreIndicator';
import { Badge } from '../common/Badge';
import type { IncidentReport } from '../../types/civic';
import type { ActiveTab } from '../navigation/DesktopSidebar';

interface HomeDashboardProps {
  onSelectIncident: (inc: IncidentReport) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenEmergencyModal: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectIncident,
  onNavigateTab,
  onOpenEmergencyModal,
}) => {
  const { location } = useLocation();
  const { incidents, cctvFleet, weather, pulseScore, alerts, news } = useCivicData();

  // Fleet stats
  const onlineCameras = cctvFleet.filter((c) => c.status === 'online').length;
  const totalCameras = cctvFleet.length;
  const offlineCameras = totalCameras - onlineCameras;

  // Latest local update / alert
  const latestAlert = alerts[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* 1. CURRENT STATUS Card (matches cp3.jpeg) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex items-start justify-between">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              CURRENT STATUS
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {pulseScore.statusSummary}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {pulseScore.statusDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </div>
      </div>

      {/* 2. LOCAL UPDATE Card (matches cp3.jpeg) */}
      {latestAlert && (
        <div
          onClick={() => onNavigateTab('alerts')}
          className="bg-orange-50/70 border border-orange-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
                LOCAL UPDATE
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-orange-600 text-white rounded-md tracking-wider">
              {latestAlert.status}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-orange-700 transition-colors">
            {latestAlert.title}
          </h3>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            {latestAlert.description}
          </p>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-orange-200/50">
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>{location.area}</span>
            </div>
            <span className="text-[11px] text-slate-400">{latestAlert.timestamp}</span>
          </div>
        </div>
      )}

      {/* 3. AT A GLANCE (matches cp3.jpeg) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            AT A GLANCE
          </span>
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Refreshes live
          </span>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          {/* CCTV Card */}
          <div
            onClick={() => onNavigateTab('cctv')}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              CCTV
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
              {onlineCameras}/{totalCameras}
            </div>
            <div className="text-xs font-medium text-slate-500">
              {offlineCameras > 0 ? `${offlineCameras} offline` : 'All operational'}
            </div>
          </div>

          {/* WEATHER Card */}
          <div
            onClick={() => onNavigateTab('weather')}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
              <CloudRain className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              WEATHER
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
              {weather ? `${weather.temperatureC}°` : '28°'}
            </div>
            <div className="text-xs font-medium text-slate-500 capitalize">
              {weather ? weather.conditionText : 'Partly cloudy'}
            </div>
          </div>
        </div>

        {/* Weather advisory banner (matches cp3.jpeg) */}
        {weather?.civicAdvisory && (
          <div
            onClick={() => onNavigateTab('weather')}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  {weather.civicAdvisory.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {weather.civicAdvisory.impactText}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        )}
      </div>

      {/* 4. AI CITYPULSE INSIGHT */}
      <AiInsightCard aiData={pulseScore.aiInsight} />

      {/* 5. RISK / PULSE SCORE GAUGE */}
      <PulseScoreIndicator pulseData={pulseScore} />

      {/* 6. NEARBY INCIDENTS (matches cp3.jpeg) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            NEARBY INCIDENTS
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {incidents.length} tracked
          </span>
        </div>

        <div className="space-y-2.5">
          {incidents.slice(0, 3).map((incident) => (
            <div
              key={incident.id}
              onClick={() => onSelectIncident(incident)}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Siren className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-700 transition-colors">
                    {incident.category}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                    <span>{incident.locationName}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-600">
                      {incident.distanceKm !== undefined ? `${incident.distanceKm} km` : 'Nearby'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 ml-3">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-orange-600 text-white rounded-md tracking-wider">
                  {incident.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center">
          <button
            onClick={() => onNavigateTab('incidents')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View all civic feed incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7. CIVIC NEWS PREVIEW */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              LOCAL CIVIC NEWS
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('news')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            See all
          </button>
        </div>

        {news[0] && (
          <div
            onClick={() => onNavigateTab('news')}
            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="blue" size="sm">
                {news[0].scope} Notice
              </Badge>
              <span className="text-[11px] text-slate-400">{news[0].timestamp}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1">
              {news[0].title}
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2">
              {news[0].summary}
            </p>
          </div>
        )}
      </div>

      {/* 8. Emergency Reporting CTA card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold leading-tight">Witnessed an Urgent Civic Incident?</h3>
          <p className="text-xs text-orange-100 mt-1">
            Submit a geotagged citizen report to accelerate local civic verification and response.
          </p>
        </div>
        <button
          onClick={onOpenEmergencyModal}
          className="px-4 py-2.5 rounded-xl bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs uppercase tracking-wide shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer"
        >
          Report Incident Now
        </button>
      </div>
    </div>
  );
};
