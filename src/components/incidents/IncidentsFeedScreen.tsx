import React, { useState } from 'react';
import {
  Siren,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  CheckCircle,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import type { IncidentReport } from '../../types/civic';
import { Badge } from '../common/Badge';

interface IncidentsFeedScreenProps {
  onSelectIncident: (inc: IncidentReport) => void;
  onOpenEmergencyModal: () => void;
}

export const IncidentsFeedScreen: React.FC<IncidentsFeedScreenProps> = ({
  onSelectIncident,
  onOpenEmergencyModal,
}) => {
  const { incidents } = useCivicData();

  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filtered = incidents.filter((inc) => {
    if (search && !inc.title.toLowerCase().includes(search.toLowerCase()) && !inc.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'all' && inc.status !== selectedStatus) return false;
    return true;
  });


  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
            FUSED CIVIC TELEMETRY STREAM
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Live Civic Incidents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Multi-stream incident fusion across citizen reports, optical vision, and municipal dispatch.
          </p>
        </div>

        <button
          onClick={onOpenEmergencyModal}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Siren className="w-4 h-4" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter incidents by keyword, road, or category..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase">Severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                selectedSeverity === sev
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase">Status:</span>
          {['all', 'REPORTED', 'UNDER REVIEW', 'VERIFIED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                selectedStatus === st
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>


      {/* Incidents List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No matching incidents</h4>
            <p className="text-xs mt-1">Adjust your filters to see more signals.</p>
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              onClick={() => onSelectIncident(inc)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-orange-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Siren className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                        {inc.category}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {inc.confidencePercent}% confidence
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-orange-700 transition-colors">
                      {inc.title}
                    </h3>
                  </div>
                </div>

                <Badge
                  variant={
                    inc.severity === 'critical'
                      ? 'red'
                      : inc.severity === 'high'
                      ? 'orange'
                      : 'amber'
                  }
                  size="sm"
                >
                  {inc.status}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 pl-1">
                {inc.description}
              </p>

              {/* What to do snippet */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs mb-3 flex items-center justify-between">
                <span className="text-slate-600 font-medium truncate pr-2">
                  <strong className="text-slate-800">Action:</strong> {inc.whatToDo}
                </span>
                <span className="text-orange-600 font-bold shrink-0 text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center">
                  Full Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>{inc.locationName}</span>
                  {inc.distanceKm !== undefined && (
                    <span className="text-slate-400 font-semibold">
                      · {inc.distanceKm} km away
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{inc.timestamp}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
