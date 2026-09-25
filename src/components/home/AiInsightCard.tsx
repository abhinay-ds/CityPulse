import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';
import type { CityPulseScoreData } from '../../types/civic';

interface AiInsightCardProps {
  aiData: CityPulseScoreData['aiInsight'];
}

export const AiInsightCard: React.FC<AiInsightCardProps> = ({ aiData }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 rounded-2xl border border-indigo-100 p-5 shadow-sm relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-indigo-500/5 rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
            AI CITYPULSE INSIGHT
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
          NLP Civic Synthesis
        </span>
      </div>

      {/* Plain Language Summary */}
      <p className="text-sm text-slate-800 font-medium leading-relaxed mb-4">
        {aiData.plainLanguageSummary}
      </p>

      {/* Anomaly & Correlation Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Anomaly detection */}
        <div className="p-3 rounded-xl bg-white/90 border border-indigo-100/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
            <span>Detected Anomaly</span>
          </div>
          <p className="text-xs font-semibold text-slate-900">
            {aiData.anomalyMetric}
          </p>
        </div>

        {/* Possible correlation */}
        <div className="p-3 rounded-xl bg-white/90 border border-indigo-100/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Possible Correlation</span>
          </div>
          <p className="text-xs font-semibold text-slate-900">
            {aiData.possibleCorrelation}
          </p>
        </div>
      </div>

      {/* Epistemic Honesty Disclaimer */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white/60 px-3 py-1.5 rounded-lg border border-slate-200/60">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-medium italic">
          {aiData.epistemicDisclaimer}
        </span>
      </div>
    </div>
  );
};
