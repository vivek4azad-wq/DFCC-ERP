import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.tsx';
import { AssetCategories, type AssetCategoryKey } from './components/AssetCategories.tsx';
import { KmQuickFinder } from './components/KmQuickFinder.tsx';
import { GPSAssetMap } from './components/GPSAssetMap.tsx';
import { StaffManagement } from './components/StaffManagement.tsx';
import { StaffDirectory } from './components/StaffDirectory.tsx';
import { StaffAttendance } from './components/StaffAttendance.tsx';
import { PWayWorkManager } from './components/PWayWorkManager.tsx';
import { StoreInventoryManager } from './components/StoreInventoryManager.tsx';
import { ScheduledInspectionPopup } from './components/ScheduledInspectionPopup.tsx';
import { AdminAIChatModal } from './components/AdminAIChatModal.tsx';
import { BridgeLinearDiagram } from './components/BridgeLinearDiagram.tsx';
import { DefectManager } from './components/DefectManager.tsx';
import { LoginDashboard } from './components/LoginDashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { StoreItemPublicQRView } from './components/StoreItemPublicQRView.tsx';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  Train,
  ShieldCheck,
  User,
  Key,
  LogIn,
  Scan,
  Sparkles,
  MapPin,
  Layers,
  Info,
  Lock,
  Mail,
  Bot
} from 'lucide-react';

function MainAppShell() {
  const { currentUser, role, isAuthenticated, isLoading, login, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [prefillFromKm, setPrefillFromKm] = useState<string | null>(null);
  const [prefillToKm, setPrefillToKm] = useState<string | null>(null);

  // Standalone QR Scan Store Item View
  const [publicStoreItemId, setPublicStoreItemId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      return params.get('store_item') || (params.get('view') === 'store_item' ? params.get('id') : null);
    }
    return null;
  });

  // Modals & Popups
  const [isInspectionPopupOpen, setIsInspectionPopupOpen] = useState(true);
  const [isAIChatModalOpen, setIsAIChatModalOpen] = useState(false);

  // Navigation filter states for cross-screen deep-linking
  const [assetCategory, setAssetCategory] = useState<AssetCategoryKey | null>(null);
  const [assetSectionFilter, setAssetSectionFilter] = useState<string | undefined>(undefined);
  const [assetStationFilter, setAssetStationFilter] = useState<string | undefined>(undefined);
  const [staffDirectoryTab, setStaffDirectoryTab] = useState<'officers' | 'outsourced' | 'keymen' | 'patrol' | 'watchmen'>('officers');

  // Standalone Login Form State (Real Firebase Auth)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(err => {
        console.warn('Failed to set StatusBar overlay setting:', err);
      });
      StatusBar.setStyle({ style: Style.Dark }).catch(err => {
        console.warn('Failed to set StatusBar style:', err);
      });
      StatusBar.setBackgroundColor({ color: '#0f2b5c' }).catch(err => {
        console.warn('Failed to set StatusBar background color:', err);
      });
    }
  }, []);

  // Listen for global custom events from Navbar / Sidebar / Widgets
  useEffect(() => {
    const handleOpenInspections = () => setIsInspectionPopupOpen(true);
    const handleOpenAIChat = () => setIsAIChatModalOpen(true);

    window.addEventListener('raildiary_open_inspections_popup', handleOpenInspections);
    window.addEventListener('raildiary_open_ai_chat', handleOpenAIChat);

    return () => {
      window.removeEventListener('raildiary_open_inspections_popup', handleOpenInspections);
      window.removeEventListener('raildiary_open_ai_chat', handleOpenAIChat);
    };
  }, []);

  const handleQuickJump = (fromKm: string, toKm: string) => {
    setPrefillFromKm(fromKm);
    setPrefillToKm(toKm);
    setActiveTab('kmfinder');
  };

  const handleNavigateToAsset = (category: AssetCategoryKey, sectionFilter?: string, stationFilter?: string) => {
    setAssetCategory(category);
    setAssetSectionFilter(sectionFilter);
    setAssetStationFilter(stationFilter);
    setActiveTab('categories');
  };

  const handleNavigateToStaff = (tab: 'officers' | 'outsourced' | 'keymen' | 'patrol' | 'watchmen') => {
    setStaffDirectoryTab(tab);
    if (tab === 'officers') setActiveTab('officers');
    else if (tab === 'outsourced') setActiveTab('outsourced');
    else if (tab === 'keymen') setActiveTab('keymen');
    else if (tab === 'patrol') setActiveTab('patrol');
    else setActiveTab('officers');
  };

  const handleStandaloneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your official Email and Password.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await login(loginEmail.trim(), loginPassword);
      if (!res.success) {
        setLoginError(res.message || 'Authentication failed. Please check your credentials.');
      } else {
        // Trigger inspection alert on fresh successful login
        setIsInspectionPopupOpen(true);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // -------------------------------------------------------------------------
  // 1. IF LOADING: RENDER POLISHED SPLASH SCREEN
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="space-y-4 animate-fadeIn">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-2xl border-2 border-blue-400/40 bg-[#0d234a] flex items-center justify-center animate-pulse">
            <img src="/logo.png" alt="DFCCIL ERP Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">DFCCIL ERP</h2>
            <p className="text-xs text-blue-300 font-mono">Initializing IMSD-SMUN Telemetry &amp; Adaptive Sync...</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 1.5 IF PUBLIC STORE ITEM QR SCAN: RENDER INSTANT VERIFICATION VIEW
  // -------------------------------------------------------------------------
  if (publicStoreItemId) {
    return (
      <StoreItemPublicQRView
        itemId={publicStoreItemId}
        onBackToApp={() => {
          setPublicStoreItemId(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 2. IF NOT AUTHENTICATED: RENDER FULL-PAGE LOGIN SCREEN FIRST
  // -------------------------------------------------------------------------
  if (!isAuthenticated || !currentUser) {
    return (
      <div
        className="min-h-screen bg-[#f0f4f9] text-slate-900 flex flex-col justify-between p-4 antialiased selection:bg-[#0f2b5c] selection:text-white"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)' }}
      >
        <div className="max-w-md w-full mx-auto my-auto space-y-5 animate-fadeIn py-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-xl border-2 border-blue-400/40 bg-[#0d234a]">
              <img src="/logo.png" alt="DFCCIL ERP Logo" className="w-full h-full object-cover" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-[#0f2b5c] tracking-tight">DFCCIL ERP</h1>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                IMSD-SMUN Unit (Civil) • Km 1162.800 to Km 1249.720
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Official Firebase Sign In
              </span>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold animate-fadeIn">
                {loginError}
              </div>
            )}

            {/* Firebase Auth Form */}
            <form onSubmit={handleStandaloneLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Official Email Address:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="vkazad@dfcc.co.in"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Secure Password:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-[#0f2b5c] hover:bg-[#163a75] text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In with Firebase</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Quick Role Demo Logins:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchRole('SUPER_ADMIN')}
                  className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-left transition"
                >
                  <div className="font-bold text-xs">APM Admin</div>
                  <div className="text-[10px] text-purple-700 font-mono truncate">Sh. Vivek K. Azad</div>
                </button>

                <button
                  type="button"
                  onClick={() => switchRole('OFFICER')}
                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-left transition"
                >
                  <div className="font-bold text-xs">Officer (P-Way)</div>
                  <div className="text-[10px] text-blue-700 font-mono truncate">Sh. Arjun Kumar</div>
                </button>

                <button
                  type="button"
                  onClick={() => switchRole('STAFF')}
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-left transition"
                >
                  <div className="font-bold text-xs">MTS Staff</div>
                  <div className="text-[10px] text-emerald-700 font-mono truncate">Pinki Sharma</div>
                </button>

                <button
                  type="button"
                  onClick={() => switchRole('STORE_KEEPER')}
                  className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-left transition"
                >
                  <div className="font-bold text-xs">Store Keeper</div>
                  <div className="text-[10px] text-amber-700 font-mono truncate">Sh. Rameshwar Prasad</div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/70 border border-slate-200 rounded-xl p-3 text-center text-xs space-y-0.5">
            <div className="font-semibold text-slate-700">
              Developed by: <span className="font-bold text-slate-900">Vivek Kumar Azad</span>
            </div>
            <div className="text-[11px] text-blue-800 font-medium">
              Assistant Project Manager / Civil
            </div>
            <div className="text-[10px] text-slate-500">
              Dedicated Freight Corridor Corporation of India Ltd. (IMSD SMUN)
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // IF AUTHENTICATED: RENDER MAIN DASHBOARD SHELL
  // -------------------------------------------------------------------------
  const currentTab = activeTab === 'admin' && role !== 'SUPER_ADMIN' ? 'analytics' : activeTab;

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'analytics':
        return (
          <AnalyticsDashboard
            onQuickJump={handleQuickJump}
            onNavigateToAsset={handleNavigateToAsset}
            onNavigateToStaff={handleNavigateToStaff}
            onNavigateToTab={setActiveTab}
          />
        );
      case 'kmfinder':
        return (
          <KmQuickFinder
            prefillFromKm={prefillFromKm}
            prefillToKm={prefillToKm}
            clearPrefill={() => {
              setPrefillFromKm(null);
              setPrefillToKm(null);
            }}
          />
        );
      case 'linear':
        return <BridgeLinearDiagram />;
      case 'bridges':
        return <AssetCategories initialCategory="bridges" initialSectionFilter={assetSectionFilter} />;
      case 'points_crossings':
        return <AssetCategories initialCategory="points_crossings" initialStationFilter={assetStationFilter} />;
      case 'curves':
        return <AssetCategories initialCategory="curves" initialSectionFilter={assetSectionFilter} />;
      case 'lwr_lc_sej':
        return <AssetCategories initialCategory="lwr" />;
      case 'officers':
        return <StaffDirectory initialTab="officers" />;
      case 'keymen':
        return <StaffDirectory initialTab="keymen" />;
      case 'gatemen':
        return <StaffDirectory initialTab="gatemen" />;
      case 'patrol':
        return <StaffDirectory initialTab="patrol" />;
      case 'watchmen':
        return <StaffDirectory initialTab="watchmen" />;
      case 'outsourced':
        return <StaffDirectory initialTab="outsourced" />;
      case 'categories':
        return (
          <AssetCategories
            initialCategory={assetCategory}
            initialSectionFilter={assetSectionFilter}
            initialStationFilter={assetStationFilter}
          />
        );
      case 'gpsmap':
        return <GPSAssetMap />;
      case 'defects':
        return <DefectManager />;
      case 'staff':
        return <StaffDirectory initialTab={staffDirectoryTab || 'officers'} />;
      case 'pway_work':
        return <PWayWorkManager />;
      case 'store':
        return <StoreInventoryManager />;
      case 'attendance':
        return <StaffAttendance />;
      case 'staff_mgmt':
        return <StaffManagement />;
      case 'login_profile':
        return <LoginDashboard />;
      case 'admin':
        return <AdminPanel />;
      default:
        return (
          <AnalyticsDashboard
            onQuickJump={handleQuickJump}
            onNavigateToAsset={handleNavigateToAsset}
            onNavigateToStaff={handleNavigateToStaff}
            onNavigateToTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#070c18] text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200 w-full max-w-[100vw] overflow-x-hidden">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={currentTab}
        setActiveTab={setActiveTab}
        onOpenQuickFinder={() => setActiveTab('kmfinder')}
        onOpenAIChat={() => setIsAIChatModalOpen(true)}
        onOpenInspectionsAlert={() => setIsInspectionPopupOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8 overflow-x-hidden">
        {/* Desktop / Tablet Sidebar */}
        <Sidebar activeTab={currentTab} setActiveTab={setActiveTab} />

        {/* Dynamic Content View Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 w-full overflow-x-hidden overflow-y-auto">
          {renderActiveScreen()}
        </main>
      </div>

      {/* 🔍 Startup & On-Demand Scheduled Inspection Popup Alert */}
      <ScheduledInspectionPopup
        isOpen={isInspectionPopupOpen}
        onClose={() => setIsInspectionPopupOpen(false)}
        onNavigateToInspections={() => setActiveTab('pway_work')}
      />

      {/* 🤖 Admin AI Search & Firebase Log Assistant Modal */}
      <AdminAIChatModal
        isOpen={isAIChatModalOpen}
        onClose={() => setIsAIChatModalOpen(false)}
        onNavigateTab={tab => setActiveTab(tab)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
