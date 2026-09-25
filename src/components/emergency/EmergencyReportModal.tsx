import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  Paperclip,
  Crosshair,
  Send,
  CheckCircle2,
  Shield,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import type { IncidentCategory, IncidentReport, ReportLifecycleStatus } from '../../types/civic';
import { useCivicData } from '../../context/CivicDataContext';
import { useLocation } from '../../context/LocationContext';

interface EmergencyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: IncidentCategory[] = [
  'Fire / Smoke',
  'Flood',
  'Heavy Rain',
  'Earthquake',
  'Cyclone',
  'Landslide',
  'Gas Leak',
  'Major Road Accident',
  'Road Blockage',
  'Infrastructure Damage',
  'Other Emergency',
];

export const EmergencyReportModal: React.FC<EmergencyReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { location } = useLocation();
  const { submitIncidentReport, updateIncidentStatus } = useCivicData();

  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory>('Fire / Smoke');
  const [description, setDescription] = useState('');
  const [hasLocationShared, setHasLocationShared] = useState(true);
  const [mediaAttached, setMediaAttached] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<IncidentReport | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const rep = await submitIncidentReport({
        category: selectedCategory,
        description: description.trim(),
        coords: hasLocationShared
          ? location.coords
          : { lat: location.coords.lat + 0.001, lng: location.coords.lng + 0.001 },
        evidenceMediaUrl: mediaAttached || undefined,
      });
      setSubmittedReport(rep);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateStatusAdvance = () => {
    if (!submittedReport) return;
    const stages: ReportLifecycleStatus[] = [
      'REPORT RECEIVED',
      'REPORTED',
      'UNDER REVIEW',
      'VERIFIED',
      'RESPONSE INITIATED',
      'RESOLVED',
    ];
    const currentIndex = stages.indexOf(submittedReport.status);
    if (currentIndex < stages.length - 1) {
      const nextStatus = stages[currentIndex + 1];
      updateIncidentStatus(submittedReport.id, nextStatus);
      setSubmittedReport({ ...submittedReport, status: nextStatus });
    }
  };

  const resetForm = () => {
    setSubmittedReport(null);
    setDescription('');
    setMediaAttached(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Top Header matching cp2.jpeg / cp4.jpeg */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              SAFETY REPORT
            </span>
            <button
              onClick={resetForm}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {submittedReport ? 'Report Status Tracker' : 'Report an incident'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {submittedReport
              ? 'Your civic safety report has been logged into the live incident stream.'
              : 'Help your locality respond faster. Your report will start as unverified.'}
          </p>
        </div>

        {submittedReport ? (
          /* Report Lifecycle Status Tracker Screen */
          <div className="px-6 pb-6 space-y-4">
            {/* Success Alert Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm">Report Successfully Registered</span>
              </div>
              <p className="text-xs text-emerald-700">
                Incident ticket: <span className="font-mono font-bold">{submittedReport.id}</span>
                {submittedReport.emergencyReportId ? (
                  <>
                    <br />
                    Emergency ticket:{' '}
                    <span className="font-mono font-bold">{submittedReport.emergencyReportId}</span>
                  </>
                ) : null}
              </p>
            </div>

            {/* Stepped Lifecycle Tracking */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                INCIDENT LIFECYCLE PROGRESSION
              </span>

              <div className="space-y-3">
                {(
                  [
                    'REPORT RECEIVED',
                    'REPORTED',
                    'UNDER REVIEW',
                    'VERIFIED',
                    'RESPONSE INITIATED',
                    'RESOLVED',
                  ] as ReportLifecycleStatus[]
                ).map((stage, idx) => {
                  const stageIndex = [
                    'REPORT RECEIVED',
                    'REPORTED',
                    'UNDER REVIEW',
                    'VERIFIED',
                    'RESPONSE INITIATED',
                    'RESOLVED',
                  ].indexOf(submittedReport.status);
                  const isPassed = stageIndex >= idx;
                  const isCurrent = stageIndex === idx;

                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                          isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-orange-600 font-extrabold'
                              : isPassed
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded font-normal uppercase">
                              Active Stage
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simulation button to advance stage */}
              <button
                type="button"
                onClick={handleSimulateStatusAdvance}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Simulate Next Stage Progression</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Authority Routing Disclaimer Box */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Routing Prepared (Simulated)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Department: <strong>{submittedReport.authorityRouting.department}</strong>.
                Routing is prepared in simulation. In an immediate life-threatening emergency, call
                official helplines directly:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg text-xs"
                >
                  <PhoneCall className="w-3 h-3" /> Dial 112 Emergency
                </a>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          /* Input Form matching cp2.jpeg / cp4.jpeg */
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {/* Section 1: WHAT HAPPENED? */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                WHAT HAPPENED?
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <AlertCircle
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-white' : 'text-orange-600'
                        }`}
                      />
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: SHORT DESCRIPTION */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                SHORT DESCRIPTION
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="What should neighbors know?"
                  rows={3}
                  className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none placeholder:text-slate-400"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] font-medium text-slate-400">
                  {description.length}/500
                </span>
              </div>
            </div>

            {/* Section 3: EVIDENCE & LOCATION */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                EVIDENCE & LOCATION
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Media card */}
                <button
                  type="button"
                  onClick={() =>
                    setMediaAttached(
                      mediaAttached ? null : 'civic_evidence_attachment_photo.jpg'
                    )
                  }
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    mediaAttached
                      ? 'bg-orange-50/80 border-orange-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Paperclip
                    className={`w-4 h-4 mb-1.5 ${
                      mediaAttached ? 'text-orange-600' : 'text-orange-500'
                    }`}
                  />
                  <div className="text-xs font-bold text-slate-900">
                    {mediaAttached ? 'Photo Attached' : 'Attach media'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {mediaAttached ? '1 item ready' : 'Photo or video'}
                  </div>
                </button>

                {/* Location card */}
                <button
                  type="button"
                  onClick={() => setHasLocationShared(!hasLocationShared)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    hasLocationShared
                      ? 'bg-orange-50/80 border-orange-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Crosshair
                    className={`w-4 h-4 mb-1.5 ${
                      hasLocationShared ? 'text-orange-600' : 'text-slate-400'
                    }`}
                  />
                  <div className="text-xs font-bold text-slate-900">
                    {hasLocationShared ? 'Location Shared' : 'Share location'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {hasLocationShared ? location.area : 'Location not shared'}
                  </div>
                </button>
              </div>
            </div>

            {/* Large Submit CTA button */}
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-98 cursor-pointer mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering report...' : 'Submit report'}</span>
            </button>

            {/* Footer Notice matching cp2.jpeg / cp4.jpeg */}
            <p className="text-[11px] text-slate-500 text-center leading-normal pt-1">
              Reports are shown as REPORTED until reviewed by authorized civic teams.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
