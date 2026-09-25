import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CivicDataProvider } from './context/CivicDataContext';
import { DesktopSidebar, type ActiveTab } from './components/navigation/DesktopSidebar';
import { TopNavBar } from './components/navigation/TopNavBar';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { OfflineBanner } from './components/common/OfflineBanner';
import { LocationSelectorModal } from './components/common/LocationSelectorModal';
import { EmergencyReportModal } from './components/emergency/EmergencyReportModal';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';

// Screens
import { HomeDashboard } from './components/home/HomeDashboard';
import { LiveMapScreen } from './components/map/LiveMapScreen';
import { IncidentsFeedScreen } from './components/incidents/IncidentsFeedScreen';
import { CctvIntelligenceScreen } from './components/cctv/CctvIntelligenceScreen';
import { LocalAlertsScreen } from './components/alerts/LocalAlertsScreen';
import { CivicNewsScreen } from './components/news/CivicNewsScreen';
import { WeatherView } from './components/weather/WeatherView';
import { UserProfileView } from './components/profile/UserProfileView';
import type { IncidentReport } from './types/civic';

/* ------------------------------------------------------------------ */
/* Auth gate — shows login/signup or dashboard                         */
/* ------------------------------------------------------------------ */

type AuthScreen = 'login' | 'signup';

function AuthGate() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');

  // Show loading spinner while checking existing session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading CityPulse…</p>
        </div>
      </div>
    );
  }

  // User has access (authenticated or guest) — show dashboard
  if (isAuthenticated || isGuest) {
    return (
      <LocationProvider>
        <CivicDataProvider>
          <CityPulseApp />
        </CivicDataProvider>
      </LocationProvider>
    );
  }

  // Not authenticated — show auth screens
  if (authScreen === 'signup') {
    return <SignupPage onNavigateToLogin={() => setAuthScreen('login')} />;
  }
  return <LoginPage onNavigateToSignup={() => setAuthScreen('signup')} />;
}

/* ------------------------------------------------------------------ */
/* Dashboard shell (existing logic, untouched)                         */
/* ------------------------------------------------------------------ */

export function CityPulseApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  const handleSelectIncidentFromFeed = (inc: IncidentReport) => {
    setSelectedIncident(inc);
    setActiveTab('map');
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeDashboard
            onSelectIncident={handleSelectIncidentFromFeed}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          />
        );
      case 'map':
        return (
          <LiveMapScreen
            selectedIncident={selectedIncident}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
          />
        );
      case 'incidents':
        return (
          <IncidentsFeedScreen
            onSelectIncident={handleSelectIncidentFromFeed}
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          />
        );
      case 'cctv':
        return <CctvIntelligenceScreen />;
      case 'alerts':
        return <LocalAlertsScreen />;
      case 'news':
        return <CivicNewsScreen />;
      case 'weather':
        return <WeatherView />;
      case 'profile':
        return (
          <UserProfileView
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          />
        );
      default:
        return (
          <HomeDashboard
            onSelectIncident={handleSelectIncidentFromFeed}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Offline and Degradation Status Banner */}
      <OfflineBanner />

      <div className="flex-1 flex w-full">
        {/* Persistent Desktop Sidebar */}
        <DesktopSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavBar
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
            onOpenProfileTab={() => setActiveTab('profile')}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderActiveScreen()}
          </main>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar matching cp1 and cp3 */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      <EmergencyReportModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
