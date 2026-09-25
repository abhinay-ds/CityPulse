import React, { useState } from 'react';
import { MapPin, CheckCircle, Building2 } from 'lucide-react';

import { useCivicData } from '../../context/CivicDataContext';
import { useLocation } from '../../context/LocationContext';
import type { NewsHierarchyScope } from '../../types/civic';
import { Badge } from '../common/Badge';

export const CivicNewsScreen: React.FC = () => {
  const { news } = useCivicData();
  const { location } = useLocation();

  const [activeScope, setActiveScope] = useState<NewsHierarchyScope | 'All'>('All');

  const scopes: Array<NewsHierarchyScope | 'All'> = ['All', 'Area', 'Mandal', 'District', 'Nearby'];

  const filteredNews = news.filter((item) => {
    if (activeScope === 'All') return true;
    return item.scope === activeScope;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
          MUNICIPAL BULLETIN & INTELLIGENCE
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Civic News
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Seeded municipal bulletins from the CityPulse API. These are demo civic notices, not a live
          news wire.
        </p>
      </div>

      {/* Hierarchy Tabs (Area, Mandal, District, Nearby) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {scopes.map((scope) => {
          const isActive = activeScope === scope;
          return (
            <button
              key={scope}
              onClick={() => setActiveScope(scope)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {scope === 'All' ? 'All Civic Dispatches' : `${scope} Level`}
            </button>
          );
        })}
      </div>

      {/* Current location hierarchy context banner */}
      <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span>Active Hierarchy:</span>
          <strong className="text-slate-900">{location.area}</strong>
          <span>→</span>
          <span>{location.mandal}</span>
          <span>→</span>
          <span>{location.district}</span>
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {filteredNews.map((item) => (
          <article
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={item.scope === 'Area' ? 'orange' : 'blue'} size="sm">
                  {item.scope}
                </Badge>
                {item.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    Verified Civic Dispatch
                  </span>
                )}
                {item.isDemo && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Demo bulletin
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{item.timestamp}</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2">
              {item.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              {item.summary}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.source}</span>
              </div>
              <span className="text-[11px] text-slate-400">Sector: {item.locationTag}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
