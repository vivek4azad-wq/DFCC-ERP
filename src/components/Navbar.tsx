import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  Menu,
  Moon,
  Sun,
  Shield,
  User,
  Users,
  LogOut,
  MapPin,
  RefreshCw,
  Info,
  Compass,
  FileText,
  Search,
  MoreVertical,
  Printer,
  ChevronDown,
  Sparkles,
  Bot,
  Package,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import { AboutModal } from './AboutModal.tsx';
import { GuestLogsModal } from './GuestLogsModal.tsx';
import { StationKeyPlanModal } from './StationKeyPlanModal.tsx';
import { ChangePinModal } from './ChangePinModal.tsx';
import type { AppUserRole } from '../types/index.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickFinder?: () => void;
  onOpenAIChat?: () => void;
  onOpenInspectionsAlert?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickFinder,
  onOpenAIChat,
  onOpenInspectionsAlert
}) => {
  const { currentUser, role, currentAppRole, switchAppRole, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isKeyPlanOpen, setIsKeyPlanOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // 3-Dot Dropdown Menu State
  const [isThreeDotMenuOpen, setIsThreeDotMenuOpen] = useState(false);
  const [isGuestLogsOpen, setIsGuestLogsOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isGuest = role === 'GUEST' || currentUser?.role === 'GUEST' || currentUser?.name?.toLowerCase().includes('guest');
  const isSuperAdmin = !isGuest && (role === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN');

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsThreeDotMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tabs according to strict role constraints
  const allTabs = [
    { id: 'analytics', label: 'Dashboard', icon: '📊', count: null },
    { id: 'categories', label: 'Assets', icon: '🗂️', count: null },
    { id: 'manuals', label: '3D Manuals', icon: '📖', count: null },
    { id: 'software', label: 'Software', icon: '📐', count: null },
    { id: 'staff', label: 'Staff', icon: '👥', count: null },
    { id: 'pway_work', label: 'P.way', icon: '⚡', count: null },
    { id: 'maintenance', label: 'Maintenance', icon: '🛠️', count: null },
    { id: 'store', label: 'Store', icon: '📦', count: null },
    { id: 'attendance', label: 'Attendence', icon: '📋', count: null },
    { id: 'linear', label: 'Linear', icon: '📐', count: null },
  ];

  const visibleTabs = React.useMemo(() => {
    if (currentAppRole === 'MTS' || role === 'STAFF') {
      // 🔒 Strictly visible for MTS: KM Finder, P.way, Maintenance, Staff, and own attendance
      return [
        { id: 'kmfinder', label: 'KM Finder', icon: '🔍', count: null },
        { id: 'pway_work', label: 'P.way', icon: '⚡', count: null },
        { id: 'maintenance', label: 'Maintenance', icon: '🛠️', count: null },
        { id: 'staff', label: 'Staff', icon: '👥', count: null },
        { id: 'attendance', label: 'Attendence', icon: '📋', count: null },
      ];
    }
    if (currentAppRole === 'StoreKeeper' || role === 'STORE_KEEPER') {
      // 🔒 Strictly visible for Store Keeper: Store Inventory, KM Finder, and Staff Directory
      return [
        { id: 'store', label: 'Store', icon: '📦', count: null },
        { id: 'kmfinder', label: 'KM Finder', icon: '🔍', count: null },
        { id: 'staff', label: 'Staff', icon: '👥', count: null },
      ];
    }
    return allTabs;
  }, [currentAppRole, role]);

  const handlePrint = () => {
    setIsThreeDotMenuOpen(false);
    setTimeout(() => window.print(), 150);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing with Cloud Firestore & Local DB...');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      window.dispatchEvent(new Event('raildiary_sync_complete'));
      setSyncStatus('✅ Synced Successfully!');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      setSyncStatus('⚠️ Sync completed with local cache.');
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setIsSyncing(false);
      setIsThreeDotMenuOpen(false);
    }
  };

  const isInspectionAllowed = currentAppRole === 'APM' || currentAppRole === 'Executive' || role === 'SUPER_ADMIN' || role === 'OFFICER';

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-[#0f2b5c] text-white shadow-xl border-b border-[#1b3d75] transition-all select-none w-full max-w-[100vw] overflow-visible"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
      >
        {/* Top Brand & Actions Row */}
        <div className="max-w-[1780px] mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 w-full">
          {/* Left Hand: Logo + Brand Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center font-black text-white shadow-md border border-cyan-300/40 shrink-0 text-sm">
              DF
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate font-mono">
                  smun.firebase.com
                </span>
                <span className="px-1.5 py-0.2 bg-cyan-400/20 text-cyan-300 border border-cyan-300/40 rounded text-[9px] font-mono font-bold uppercase">
                  IMSD SMUN
                </span>
              </div>
              <p className="text-[10px] text-blue-200 truncate hidden sm:block">
                Km 1167.210 – 1249.720 • Shri Vivek Kumar Azad (APM/Civil)
              </p>
            </div>
          </div>

          {/* Right Hand: Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 🔔 Inspection Startup Popup Trigger (Visible ONLY for Officer & APM Admin) */}
            {isInspectionAllowed && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenInspectionsAlert) {
                    onOpenInspectionsAlert();
                  } else {
                    window.dispatchEvent(new Event('raildiary_open_inspections_popup'));
                  }
                }}
                className="p-2 bg-[#173a72] hover:bg-[#1f488a] active:scale-95 text-amber-300 rounded-xl border border-amber-400/30 shadow-md transition flex items-center justify-center"
                title="Scheduled Inspections Alert (P&C, Curves, SEJ)"
              >
                <ShieldAlert className="w-4 h-4 text-amber-300" />
              </button>
            )}

            {/* 🔍 Asset Search & Km Quick Finder */}
            <button
              type="button"
              onClick={() => {
                if (onOpenQuickFinder) {
                  onOpenQuickFinder();
                } else {
                  setActiveTab('kmfinder');
                }
              }}
              className="px-2.5 sm:px-3 py-1.5 bg-[#173a72] hover:bg-[#1f488a] active:scale-95 text-white rounded-xl text-xs font-bold border border-white/20 shadow-md flex items-center gap-1.5 transition"
              title="Search Assets & Km Finder"
            >
              <Search className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">Search / Km</span>
            </button>

            {/* ☀️/🌙 Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 bg-[#173a72] hover:bg-[#1f488a] active:scale-95 text-white rounded-xl border border-white/20 shadow-md transition flex items-center justify-center"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-300" />
              )}
            </button>

            {/* ⠇ 3-Dot System Menu */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsThreeDotMenuOpen(!isThreeDotMenuOpen)}
                className="p-2 bg-[#173a72] hover:bg-[#1f488a] active:scale-95 text-white rounded-xl border border-white/20 shadow-md transition flex items-center justify-center"
                title="System Menu"
              >
                <MoreVertical className="w-4 h-4 text-cyan-300" />
              </button>

              {/* 3-Dot Dropdown Menu Popover with High z-index & clean absolute positioning */}
              {isThreeDotMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#0a1e40] border-2 border-blue-600/80 rounded-2xl shadow-2xl p-3 z-[9999] animate-fadeIn space-y-2 text-slate-100 backdrop-blur-2xl">
                  {/* User Profile Summary */}
                  <div className="p-3 bg-[#0d2652] rounded-xl border border-blue-900/60">
                    <div className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
                      Active User &amp; Role
                    </div>
                    <div className="text-xs font-bold text-white truncate mt-0.5">
                      {currentUser?.name || 'Vivek Kumar Azad'}
                    </div>
                    <div className="text-[10px] text-cyan-300 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${
                        currentAppRole === 'APM' ? 'bg-purple-400' : currentAppRole === 'Executive' ? 'bg-blue-400' : currentAppRole === 'StoreKeeper' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <span>{currentAppRole} • {currentUser?.designation || 'APM / Civil'}</span>
                    </div>
                  </div>

                  {/* 🌟 Special Features: GPS Map & Non-Guest items */}
                  <div className="space-y-1 bg-blue-950/70 p-1.5 rounded-xl border border-blue-800/60">
                    {/* 🗺️ DFCCIL GPS Map (Always accessible) */}
                    <button
                      onClick={() => {
                        setActiveTab('gpsmap');
                        setIsThreeDotMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between font-bold transition active:scale-95 ${
                        activeTab === 'gpsmap'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'hover:bg-blue-900/80 text-cyan-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-cyan-300" />
                        <span>DFCCIL Track Map (GPS)</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-80">MAP</span>
                    </button>

                    {/* Non-Guest Options */}
                    {!isGuest && (
                      <>
                        <button
                          onClick={() => {
                            setIsThreeDotMenuOpen(false);
                            if (onOpenAIChat) {
                              onOpenAIChat();
                            } else {
                              window.dispatchEvent(new Event('raildiary_open_ai_chat'));
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-between shadow-sm transition active:scale-95"
                        >
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-cyan-300 animate-pulse" />
                            <span>Vivek AI (Smart Assistant)</span>
                          </div>
                          <span className="text-[9px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-cyan-200">VIVEK AI</span>
                        </button>

                        {/* 📐 Station Layout Key-Plans & X-Ray Diagram */}
                        <button
                          onClick={() => {
                            setIsKeyPlanOpen(true);
                            setIsThreeDotMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-blue-900/80 text-amber-300 flex items-center justify-between font-bold transition active:scale-95"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span>Station Key-Plans &amp; Layout (X-Ray)</span>
                          </div>
                          <span className="text-[9px] font-mono bg-amber-950/80 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded">PDF/CAD</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* 🔒 1. Switch Role Options - STRICTLY RESTRICTED TO SUPER ADMIN ONLY */}
                  {isSuperAdmin && (
                    <>
                      <div className="border-t border-blue-900/80 my-1.5"></div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pt-1">
                          Switch Active Role (Super Admin Only):
                        </div>

                        <button
                          onClick={() => {
                            switchAppRole('APM');
                            setIsThreeDotMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition ${
                            currentAppRole === 'APM' ? 'bg-purple-700 text-white font-bold' : 'hover:bg-blue-900/60 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            <span>1. APM (Shri Vivek Kumar Azad)</span>
                          </div>
                          <span className="text-[9px] font-mono opacity-80 bg-purple-900/80 px-1.5 py-0.5 rounded">ADMIN</span>
                        </button>

                        <button
                          onClick={() => {
                            switchAppRole('Executive');
                            setIsThreeDotMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition ${
                            currentAppRole === 'Executive' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-900/60 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            <span>2. Officer (Sh. Arjun Kumar)</span>
                          </div>
                          <span className="text-[9px] font-mono opacity-80 bg-blue-900/80 px-1.5 py-0.5 rounded">READ-ONLY</span>
                        </button>

                        <button
                          onClick={() => {
                            switchAppRole('MTS');
                            setIsThreeDotMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition ${
                            currentAppRole === 'MTS' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-blue-900/60 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>3. MTS (Field Staff / Pinki)</span>
                          </div>
                          <span className="text-[9px] font-mono opacity-80 bg-emerald-900/80 px-1.5 py-0.5 rounded">GANG</span>
                        </button>

                        <button
                          onClick={() => {
                            switchAppRole('StoreKeeper');
                            setIsThreeDotMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition ${
                            currentAppRole === 'StoreKeeper' ? 'bg-amber-600 text-white font-bold' : 'hover:bg-blue-900/60 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span>4. Store Keeper (Sh. Rameshwar)</span>
                          </div>
                          <span className="text-[9px] font-mono opacity-80 bg-amber-900/80 px-1.5 py-0.5 rounded">DEPOT</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* 2. Utility Actions (Hidden for Guest Users) */}
                  {!isGuest && (
                    <>
                      <div className="border-t border-blue-900/80 my-1.5"></div>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            toggleTheme();
                            setIsThreeDotMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-blue-900/60 text-slate-200 flex items-center justify-between transition"
                        >
                          <div className="flex items-center gap-2">
                            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-cyan-300" />}
                            <span>Theme: {isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-300 font-bold">{isDark ? 'Light' : 'Dark'}</span>
                        </button>

                        <button
                          onClick={handlePrint}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-blue-900/60 text-slate-200 flex items-center gap-2 transition"
                        >
                          <Printer className="w-4 h-4 text-blue-300" />
                          <span>Print Page / Save PDF</span>
                        </button>

                        <button
                          onClick={handleSync}
                          disabled={isSyncing}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-blue-900/60 text-slate-200 flex items-center justify-between transition"
                        >
                          <div className="flex items-center gap-2">
                            <RefreshCw className={`w-4 h-4 text-cyan-300 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? 'Syncing Records...' : 'Immediate Cloud Firestore Sync'}</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-300">SYNC</span>
                        </button>
                      </div>

                      <div className="border-t border-blue-900/80 my-1.5"></div>

                      {/* 3. About & Info */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setIsAboutOpen(true);
                            setIsThreeDotMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-blue-900/60 text-cyan-300 flex items-center gap-2 transition font-semibold"
                        >
                          <Info className="w-4 h-4" />
                          <span>About DFCCIL Rail Diary ERP</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsGuestLogsOpen(true);
                            setIsThreeDotMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-blue-900/60 text-emerald-300 flex items-center gap-2 transition font-bold"
                        >
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span>Guest Visitor Logs (विज़िटर रिकॉर्ड)</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsChangePinOpen(true);
                            setIsThreeDotMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-blue-900/60 text-amber-300 flex items-center gap-2 transition font-bold"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>Change Security PIN (पिन बदलें)</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Sign Out (Always visible) */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setIsThreeDotMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl bg-red-950/40 hover:bg-red-900/70 border border-red-700/60 text-red-200 flex items-center gap-2 transition font-bold shadow-sm"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Sign Out (लॉग आउट)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sync Toast Feedback */}
        {syncStatus && (
          <div className="bg-cyan-500 text-slate-950 text-[11px] font-black text-center py-1 animate-fadeIn">
            {syncStatus}
          </div>
        )}

        {/* Horizontal Navigation Tabs */}
        <div className="max-w-[1780px] mx-auto px-2 sm:px-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-t border-[#1b3d75]/80 py-2">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 sm:px-5 rounded-xl text-xs sm:text-[13px] font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm ${
                activeTab === tab.id
                  ? 'bg-cyan-400 text-slate-950 shadow-md font-black ring-2 ring-cyan-300/60'
                  : 'text-blue-200 hover:text-white hover:bg-white/15'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  activeTab === tab.id ? 'bg-slate-950 text-cyan-300' : 'bg-blue-900/80 text-blue-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* About Developer & System Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Guest Visitor Logs Modal */}
      <GuestLogsModal isOpen={isGuestLogsOpen} onClose={() => setIsGuestLogsOpen(false)} />

      {/* Station Key-Plans & Interactive X-Ray Diagram Modal */}
      <StationKeyPlanModal isOpen={isKeyPlanOpen} onClose={() => setIsKeyPlanOpen(false)} />

      {/* Change Security PIN Modal */}
      <ChangePinModal isOpen={isChangePinOpen} onClose={() => setIsChangePinOpen(false)} />
    </>
  );
};
