import React, { useState } from 'react';
import {
  Camera,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  EyeOff,
  Video,
  Radio,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { Badge } from '../common/Badge';


export const CctvIntelligenceScreen: React.FC = () => {
  const { cctvFleet } = useCivicData();

  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  const onlineCount = cctvFleet.filter((c) => c.status === 'online').length;
  const offlineCount = cctvFleet.length - onlineCount;

  const events = cctvFleet
    .filter((c) => c.latestEvent)
    .map((c) => ({
      cameraId: c.id,
      cameraCode: c.cameraCode,
      cameraName: c.name,
      location: `${c.area}, ${c.mandal}`,
      event: c.latestEvent!,
      status: c.status,
    }));

  const filteredEvents = events.filter((e) => {
    if (selectedEventType === 'all') return true;
    return e.event.type === selectedEventType;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
            CIVIC VISION / SENSOR INTELLIGENCE
          </span>
          <Badge variant="blue" size="sm">
            Edge AI v2.4
          </Badge>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          CCTV Event Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Privacy-preserving spatial anomaly detection from municipal cameras. Camera telemetry is
          simulated for this demo. No facial recognition, person identification, or biometrics.
        </p>
      </div>

      {/* Mandatory Privacy & Event-Only Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-start gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
          <EyeOff className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
            Zero Facial Identification Architecture
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Civic Vision operates solely on structural spatial anomalies (traffic bottlenecks, smoke,
            standing water, vehicle stoppage). No facial biometric detection or personal identity
            telemetry is implemented or retained.
          </p>
        </div>
      </div>

      {/* Fleet Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Fleet</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{cctvFleet.length} Nodes</div>
          <div className="text-xs text-slate-500 mt-0.5">Municipal Grid</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Online Streams</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{onlineCount} Live</div>
          <div className="text-xs text-slate-500 mt-0.5">99.2% uptime</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Offline Cameras</span>
          </div>
          <div className="text-2xl font-black text-amber-700">{offlineCount} Inactive</div>
          <div className="text-xs text-slate-500 mt-0.5">Inspection ticket logged</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5 text-orange-600" />
            <span>Events Detected</span>
          </div>
          <div className="text-2xl font-black text-orange-600">{events.length} Active</div>
          <div className="text-xs text-slate-500 mt-0.5">Telemetry verified</div>
        </div>
      </div>

      {/* Filter by event type */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedEventType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
            selectedEventType === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Event Types
        </button>
        {[
          'vehicle collision',
          'flooding/water accumulation',
          'traffic congestion',
          'road blockage',
          'fire/smoke',
        ].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedEventType(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 capitalize transition-colors cursor-pointer ${
              selectedEventType === type
                ? 'bg-orange-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {type.replace('/', ' / ')}
          </button>
        ))}
      </div>

      {/* Detected Events Feed */}
      <div className="space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-1">
          LIVE DETECTED EVENT STREAM
        </span>

        {filteredEvents.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.cameraCode}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-500">{item.cameraName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      Simulated
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 capitalize leading-snug">
                    {item.event.type}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    item.event.severity === 'CRITICAL'
                      ? 'red'
                      : item.event.severity === 'HIGH'
                      ? 'orange'
                      : 'amber'
                  }
                  size="sm"
                >
                  {item.event.severity} SEVERITY
                </Badge>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {item.event.confidence}% AI Confidence
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 pl-1">
              {item.event.description}
            </p>

            {/* Snapshot Simulated Bounding Box Visualization */}
            <div className="p-3 rounded-xl bg-slate-900 text-white font-mono text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Bounding Box Telemetry:</span>
                <span className="text-emerald-300 font-bold">[Class: {item.event.type}]</span>
              </div>
              <div className="text-slate-400">
                Resolution: 1080p · Optical Stream Online
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span className="font-medium text-slate-600">{item.location}</span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{item.event.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
