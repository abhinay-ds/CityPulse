import React from 'react';
import {
  Home,
  Map,
  Camera,
  Bell,
  Newspaper,
  CloudRain,
  AlertTriangle,
  Siren,
  User,
} from 'lucide-react';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/civic';

export type ActiveTab =
  | 'home'
  | 'map'
  | 'incidents'
  | 'cctv'
  | 'alerts'
  | 'news'
  | 'weather'
  | 'emergency'
  | 'profile';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenEmergencyModal: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenEmergencyModal,
}) => {
  const { pulseScore, alerts } = useCivicData();
  const { role, setRole } = useAuth();

  const navItems = [
    { id: 'home' as ActiveTab, label: 'Home Dashboard', icon: Home },
    { id: 'map' as ActiveTab, label: 'Live Civic Map', icon: Map },
    { id: 'incidents' as ActiveTab, label: 'Incidents & Feed', icon: AlertTriangle },
    { id: 'cctv' as ActiveTab, label: 'CCTV Intelligence', icon: Camera },
    {
      id: 'alerts' as ActiveTab,
      label: 'Local Alerts',
      icon: Bell,
      badge: alerts.length > 0 ? alerts.length : undefined,
    },
    { id: 'news' as ActiveTab, label: 'Civic News', icon: Newspaper },
    { id: 'weather' as ActiveTab, label: 'Weather & Impact', icon: CloudRain },
    { id: 'profile' as ActiveTab, label: 'Civic Access / Profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200/90 h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black tracking-tight text-slate-900">CITY</span>
            <span className="text-2xl font-black tracking-tight text-orange-600">PULSE</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Civic Health Intelligence
          </p>
        </div>
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
      </div>

      {/* Emergency CTA */}
      <div className="p-4 border-b border-slate-100">
        <button
          onClick={onOpenEmergencyModal}
          className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <Siren className="w-4 h-4 animate-bounce" />
          <span>REPORT AN INCIDENT</span>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Pulse & Role Switcher */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/60">
        {/* Pulse Score Mini Card */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Locality Pulse
            </span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                pulseScore.state === 'NORMAL'
                  ? 'bg-emerald-100 text-emerald-800'
                  : pulseScore.state === 'ELEVATED'
                  ? 'bg-amber-100 text-amber-800'
                  : pulseScore.state === 'HIGH'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {pulseScore.state}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-slate-900">{pulseScore.score}</span>
            <span className="text-xs text-slate-400 font-semibold">/100</span>
          </div>
        </div>

        {/* Role Selector */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Access Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-hidden focus:border-orange-500 cursor-pointer"
          >
            <option value="resident">Resident View</option>
            <option value="staff">Civic Staff Mode</option>
            <option value="responder">Emergency Responder</option>
            <option value="admin">Administrator Console</option>
          </select>
        </div>
      </div>
    </aside>
  );
};
