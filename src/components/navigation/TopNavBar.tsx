import React from 'react';
import { MapPin, Siren, ChevronRight, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useCivicData } from '../../context/CivicDataContext';
import { useAuth } from '../../context/AuthContext';
import { PulseScoreIndicator } from '../common/PulseScoreIndicator';
import { Badge } from '../common/Badge';

interface TopNavBarProps {
  onOpenLocationModal: () => void;
  onOpenEmergencyModal: () => void;
  onOpenProfileTab: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onOpenLocationModal,
  onOpenEmergencyModal,
  onOpenProfileTab,
}) => {
  const { location } = useLocation();

  const { pulseScore, refreshData } = useCivicData();
  const { userInitials, role, userName, isGuest, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Brand & Location / Desktop Hierarchy */}
        <div className="flex items-center gap-3">
          {/* Mobile Brand */}
          <div className="lg:hidden flex items-center">
            <span className="text-xl font-black tracking-tight text-slate-900">CITY</span>
            <span className="text-xl font-black tracking-tight text-orange-600">PULSE</span>
          </div>

          {/* Location Trigger button */}
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors text-left group cursor-pointer"
            title="Click to change location or detect via GPS"
          >
            <MapPin className="w-4 h-4 text-orange-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {location.area}
                </span>
                <Badge variant="green" size="sm" pulse>
                  LIVE
                </Badge>
              </div>
              {/* Hierarchy path for desktop */}
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <span>{location.district}</span>
                <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                <span>{location.mandal}</span>
              </div>
            </div>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-1 hidden sm:block" />
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Compact Pulse Score */}
          <div className="hidden md:block">
            <PulseScoreIndicator pulseData={pulseScore} compact />
          </div>

          {/* Refresh data */}
          <button
            onClick={() => refreshData()}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            title="Refresh live civic signals"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Emergency CTA button (Visible on mobile and tablet) */}
          <button
            onClick={onOpenEmergencyModal}
            className="lg:hidden flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Siren className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">REPORT</span>
          </button>

          {/* Guest mode badge */}
          {isGuest && (
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
              Guest
            </span>
          )}

          {/* Role badge for non-resident (only when authenticated) */}
          {isAuthenticated && role !== 'resident' && (
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              {role}
            </span>
          )}

          {/* User name (visible on desktop) */}
          {isAuthenticated && (
            <span className="hidden sm:inline text-xs font-bold text-slate-700 truncate max-w-32">
              {userName}
            </span>
          )}

          {/* User initials avatar matching cp3.jpeg */}
          <button
            onClick={onOpenProfileTab}
            className="w-8 h-8 rounded-full border-2 border-orange-400 flex items-center justify-center text-xs font-black text-orange-600 bg-orange-50/50 hover:bg-orange-100 transition-colors cursor-pointer shadow-2xs"
            title="User Profile & Settings"
          >
            {userInitials}
          </button>
        </div>
      </div>
    </header>
  );
};
