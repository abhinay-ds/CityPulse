import React, { useState } from 'react';
import {
  CloudRain,
  Car,
  AlertTriangle,
  Flame,
  Droplets,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import type { AlertFilterCategory, LocalAlertItem } from '../../types/civic';
import { Badge } from '../common/Badge';

export const LocalAlertsScreen: React.FC = () => {
  const { alerts } = useCivicData();


  const [activeFilter, setActiveFilter] = useState<AlertFilterCategory>('All');
  const [onlyWithin2Km, setOnlyWithin2Km] = useState(false);

  const filterOptions: AlertFilterCategory[] = ['All', 'Severe', 'Weather', 'Traffic'];

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter !== 'All' && alert.category !== activeFilter) return false;
    if (onlyWithin2Km && alert.distanceKm > 2.0) return false;
    return true;
  });

  const getAlertIcon = (type: LocalAlertItem['iconType']) => {
    switch (type) {
      case 'weather':
        return <CloudRain className="w-5 h-5 text-white stroke-[2.2]" />;
      case 'traffic':
        return <Car className="w-5 h-5 text-white stroke-[2.2]" />;
      case 'fire':
        return <Flame className="w-5 h-5 text-white stroke-[2.2]" />;
      case 'flood':
        return <Droplets className="w-5 h-5 text-white stroke-[2.2]" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-white stroke-[2.2]" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">
      {/* Top Header matching cp1.jpeg */}
      <div className="pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
            BROADCAST STREAM
          </span>
          <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
            {alerts.length}
          </span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Local alerts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Clear, local updates about incidents and conditions around you.
        </p>
      </div>

      {/* Segmented Filter Pills matching cp1.jpeg */}
      <div className="flex items-center p-1 bg-slate-200/70 rounded-2xl">
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* 2 km Safety Radius Toggle */}
      <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">2 km Safety Radius Filter</span>
        </div>
        <button
          onClick={() => setOnlyWithin2Km(!onlyWithin2Km)}
          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
            onlyWithin2Km
              ? 'bg-orange-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {onlyWithin2Km ? '≤ 2 km Active' : 'Show All Distances'}
        </button>
      </div>

      {/* Alert Cards Feed matching cp1.jpeg */}
      <div className="space-y-3.5">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No active alerts</h4>
            <p className="text-xs mt-1">There are no alerts matching this filter in your area.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 shadow-xs">
                    {getAlertIcon(alert.iconType)}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 block leading-tight">
                      {alert.priorityLabel}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {alert.title}
                    </h3>
                  </div>
                </div>

                <Badge
                  variant={alert.status === 'VERIFIED' ? 'green' : 'orange'}
                  size="sm"
                >
                  {alert.status}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 pl-1">
                {alert.description}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>{alert.area}</span>
                  {alert.distanceKm !== undefined && (
                    <span className="text-slate-400 font-semibold">
                      · {alert.distanceKm} km away
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{alert.timestamp}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
