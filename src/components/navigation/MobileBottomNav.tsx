import React from 'react';
import { Home, Map, Bell, CloudSun, User } from 'lucide-react';
import type { ActiveTab } from './DesktopSidebar';
import { useCivicData } from '../../context/CivicDataContext';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { alerts } = useCivicData();

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'map', label: 'Map', icon: Map },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: Bell,
      badge: alerts.length > 0 ? alerts.length : undefined,
    },
    { id: 'weather', label: 'Weather', icon: CloudSun },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/90 pb-safe shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors cursor-pointer ${
                isActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-orange-500 text-white rounded-full text-[10px] font-black leading-tight border border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
