import React from 'react';
import type { CityPulseScoreData } from '../../types/civic';
import { Activity, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';

interface PulseScoreIndicatorProps {
  pulseData: CityPulseScoreData;
  compact?: boolean;
}

export const PulseScoreIndicator: React.FC<PulseScoreIndicatorProps> = ({
  pulseData,
  compact = false,
}) => {
  const { score, state, statusSummary, breakdown } = pulseData;

  const colorConfig = {
    NORMAL: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      fill: '#10b981',
      icon: CheckCircle,
      label: 'NORMAL',
    },
    ELEVATED: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      fill: '#f59e0b',
      icon: Activity,
      label: 'ELEVATED',
    },
    HIGH: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      fill: '#ea580c',
      icon: AlertTriangle,
      label: 'HIGH',
    },
    CRITICAL: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      fill: '#e11d48',
      icon: ShieldAlert,
      label: 'CRITICAL',
    },
  }[state];

  const Icon = colorConfig.icon;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorConfig.bg} ${colorConfig.border} transition-all`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: colorConfig.fill }}
          />
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colorConfig.fill }}
          />
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-semibold text-slate-500">PULSE</span>
          <span className={`text-sm font-bold ${colorConfig.text}`}>{score}</span>
          <span className="text-[10px] font-bold tracking-wider text-slate-400">/100</span>
        </div>
        <span
          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${colorConfig.bg} ${colorConfig.text}`}
        >
          {colorConfig.label}
        </span>
      </div>
    );
  }

  // Full card view
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              CIVIC HEALTH PULSE
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {statusSummary}
            </h3>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
        >
          <Icon className="w-3.5 h-3.5" />
          {colorConfig.label} ({score}/100)
        </span>
      </div>

      {/* Progress Bar with 4 zones */}
      <div className="mb-4">
        <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
          <span>0 NORMAL</span>
          <span>25 ELEVATED</span>
          <span>50 HIGH</span>
          <span>75 CRITICAL 100</span>
        </div>
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
          {/* Segment marks */}
          <div
            className="h-full transition-all duration-700 rounded-full"
            style={{
              width: `${Math.max(5, score)}%`,
              backgroundColor: colorConfig.fill,
            }}
          />
        </div>
      </div>

      {/* 4 Factor breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Weather Risk</div>
          <div className="text-sm font-bold text-slate-800">{breakdown.weatherRisk}/25</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Traffic Friction</div>
          <div className="text-sm font-bold text-slate-800">{breakdown.trafficCongestion}/25</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Active Incidents</div>
          <div className="text-sm font-bold text-slate-800">{breakdown.incidentDensity}/25</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Infra Anomalies</div>
          <div className="text-sm font-bold text-slate-800">{breakdown.infrastructureAnomalies}/25</div>
        </div>
      </div>
    </div>
  );
};
