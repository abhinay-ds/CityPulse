import React from 'react';
import {
  Shield,
  MapPin,
  CheckCircle,
  Sliders,
  FileText,
  PhoneCall,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useCivicData } from '../../context/CivicDataContext';
import type { ReportLifecycleStatus, UserRole } from '../../types/civic';
import { Badge } from '../common/Badge';

interface UserProfileViewProps {
  onOpenLocationModal: () => void;
  onOpenEmergencyModal: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onOpenLocationModal,
  onOpenEmergencyModal,
}) => {
  const { role, setRole, userName, userInitials, departmentName, isAuthenticated, isGuest, logout, user } = useAuth();
  const { location } = useLocation();
  const { userReports, updateIncidentStatus } = useCivicData();

  const handleAdvanceStatus = (id: string, currentStatus: ReportLifecycleStatus) => {
    const sequence: ReportLifecycleStatus[] = [
      'REPORT RECEIVED',
      'REPORTED',
      'UNDER REVIEW',
      'VERIFIED',
      'RESPONSE INITIATED',
      'RESOLVED',
    ];
    const currentIndex = sequence.indexOf(currentStatus);
    if (currentIndex < sequence.length - 1) {
      updateIncidentStatus(id, sequence[currentIndex + 1]);
    }
  };


  const roles: Array<{ id: UserRole; title: string; desc: string }> = [
    {
      id: 'resident',
      title: 'Resident Mode',
      desc: 'Standard public civic health telemetry, emergency reporting, and safety advisories.',
    },
    {
      id: 'staff',
      title: 'Civic Staff Console',
      desc: 'Ward operations dashboard with incident triage, ticket verification, and status updates.',
    },
    {
      id: 'responder',
      title: 'Emergency Responder',
      desc: 'High-priority incident dispatch views for Fire, Police, and Medical emergency services.',
    },
    {
      id: 'admin',
      title: 'Platform Administrator',
      desc: 'Public demo controls, multi-feed sensor aggregation parameters, and system telemetry.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
          CIVIC CREDENTIALS & ACCESS
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Civic Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Manage your civic session, view your submitted safety reports, and toggle operational access roles.
        </p>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
            {userInitials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{userName}</h2>
            <p className="text-xs font-medium text-slate-500">{departmentName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                {role}
              </span>
              <span className="text-xs text-slate-400">· Active Session</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenLocationModal}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span className="hidden sm:inline">Anchor: {location.area}</span>
        </button>

      </div>

      {/* Account & Session Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Account & Session</h3>
          {isGuest && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              Guest Mode
            </span>
          )}
        </div>

        {isAuthenticated && user && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Email</span>
              <span className="text-slate-800 font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Member since</span>
              <span className="text-slate-800 font-semibold">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {isGuest && (
          <p className="text-xs text-slate-500 leading-relaxed">
            You are using CityPulse in guest mode with demo civic data.
            Create an account to access all features and persist your reports.
          </p>
        )}

        <button
          onClick={logout}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{isAuthenticated ? 'Sign Out' : 'Exit Guest Mode'}</span>
        </button>
      </div>

      {/* Role Switcher Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">Operational Role Switcher</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Demo & Civic Testing</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((r) => {
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-50/70 border-orange-400 ring-2 ring-orange-500/20'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-orange-900' : 'text-slate-800'
                    }`}
                  >
                    {r.title}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">{r.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Civic Staff Incident Triage Actions (visible in staff / admin mode) */}
      {(role === 'staff' || role === 'admin' || role === 'responder') && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
                Staff Moderation & Dispatch Queue
              </h3>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
              Authorized Personnel View
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            As {departmentName}, you can advance report lifecycle states and trigger simulated
            municipal routing dispatches.
          </p>
        </div>
      )}

      {/* Submitted Incident Reports Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">Your Submitted Reports</h3>
          </div>
          <button
            onClick={onOpenEmergencyModal}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
          >
            + New Report
          </button>
        </div>

        {userReports.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-500">
            <p className="text-xs">You have not submitted any incident reports in this session.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{report.category}</span>
                  <Badge variant="orange" size="sm">
                    {report.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">{report.description}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>Ticket: {report.id}</span>
                  <span>{report.timestamp}</span>
                </div>
                {(role === 'staff' || role === 'admin') && report.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleAdvanceStatus(report.id, report.status)}
                    className="mt-2 w-full py-1.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span>Advance Lifecycle: {report.status}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

          </div>
        )}
      </div>

      {/* Emergency Helpline Contacts */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-1.5 font-bold">
          <PhoneCall className="w-4 h-4 text-amber-600" />
          <span>National Civic & Emergency Helplines</span>
        </div>
        <p className="text-[11px] text-amber-800">
          In cases of active, immediate life safety hazards, always contact official dispatch cells:
        </p>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
          <span className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 font-bold">
            112 · Unified National Emergency
          </span>
          <span className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 font-bold">
            101 · Fire & Rescue
          </span>
          <span className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 font-bold">
            100 · Police Command
          </span>
          <span className="px-2.5 py-1 bg-white rounded-lg border border-amber-200 font-bold">
            108 · Medical Ambulance
          </span>
        </div>
      </div>
    </div>
  );
};
