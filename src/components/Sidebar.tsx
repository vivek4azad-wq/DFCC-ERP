/**
 * Navigation Sidebar & Mobile Bottom Navigation
 * DFCCIL IMSD SMUN Unit
 * Includes Auto-Hide / Toggle to Compact Icon-Only Mode
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AboutModal } from './AboutModal.tsx';
import {
  BarChart3,
  Search,
  MapPin,
  AlertTriangle,
  Users,
  ShieldCheck,
  QrCode,
  Layers,
  Sparkles,
  Grid,
  Compass,
  UserCheck,
  Info,
  CalendarCheck,
  HardHat,
  Package,
  FileText,
  Activity,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Train
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, role, currentAppRole } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dfccil_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isSuperAdmin = role === 'SUPER_ADMIN' || currentAppRole === 'APM';

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dfccil_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const masterNavItems = [
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      shortLabel: 'Analytics',
      icon: BarChart3,
      badge: 'Visual'
    },
    {
      id: 'linear',
      label: 'Linear Track Diagram',
      shortLabel: 'Linear',
      icon: Layers,
      badge: 'Schematic'
    },
    {
      id: 'keyplans',
      label: 'Station Key-Plans & Layout',
      shortLabel: 'Key-Plans',
      icon: FileText,
      badge: 'PDF / CAD'
    },
    {
      id: 'categories',
      label: 'Assets Categories',
      shortLabel: 'Categories',
      icon: Grid,
      badge: '8 Groups'
    },
    {
      id: 'kmfinder',
      label: 'Km Quick Finder',
      shortLabel: 'Km Finder',
      icon: Search,
      badge: '88.68 Km'
    },
    {
      id: 'gpsmap',
      label: 'GPS Bridges Map',
      shortLabel: 'Bridges',
      icon: Compass,
      badge: '144 GPS'
    },
    {
      id: 'pway_work',
      label: 'P-Way OMS & TRC',
      shortLabel: 'P-Way',
      icon: Activity,
      badge: 'Quality'
    },
    {
      id: 'maintenance',
      label: 'Track Maintenance',
      shortLabel: 'Maintenance',
      icon: Wrench,
      badge: '1+15 Gang'
    },
    {
      id: 'store',
      label: 'Store & Tool Depot',
      shortLabel: 'Store ERP',
      icon: Package,
      badge: 'Depot'
    },
    {
      id: 'attendance',
      label: 'Daily Attendance & Absentee',
      shortLabel: 'Attendance',
      icon: CalendarCheck,
      badge: 'ERP Roster'
    },
    {
      id: 'staff',
      label: 'Staff & Personnel ERP',
      shortLabel: 'Staff ERP',
      icon: Users,
      badge: '84 Staff'
    },
    {
      id: 'defects',
      label: 'Track Defects Logs',
      shortLabel: 'Defects',
      icon: AlertTriangle,
      badge: '48 Logs'
    },
    {
      id: 'login_profile',
      label: 'Login & User Profile',
      shortLabel: 'Profile',
      icon: UserCheck,
      badge: 'RBAC'
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'admin',
            label: 'Super Admin Panel',
            shortLabel: 'Admin',
            icon: ShieldCheck,
            badge: 'Master'
          }
        ]
      : [])
  ];

  // Strictly enforce role-based menu items
  const navItems = useMemo(() => {
    if (currentAppRole === 'MTS' || role === 'STAFF') {
      return [
        {
          id: 'kmfinder',
          label: 'Km Quick Finder',
          shortLabel: 'Km Finder',
          icon: Search,
          badge: 'Quick'
        },
        {
          id: 'pway_work',
          label: 'P.Way Track Quality & OMS',
          shortLabel: 'P.Way',
          icon: Activity,
          badge: 'OMS/TRC'
        },
        {
          id: 'maintenance',
          label: 'Track Maintenance (1+15 Gang)',
          shortLabel: 'Maintenance',
          icon: Wrench,
          badge: 'Field'
        },
        {
          id: 'staff',
          label: 'Staff Directory',
          shortLabel: 'Staff',
          icon: Users,
          badge: '84'
        },
        {
          id: 'attendance',
          label: 'My Daily Attendance',
          shortLabel: 'Attendance',
          icon: CalendarCheck,
          badge: 'Own'
        }
      ];
    }

    if (currentAppRole === 'StoreKeeper' || role === 'STORE_KEEPER') {
      return [
        {
          id: 'store',
          label: 'Store & Tool Depot',
          shortLabel: 'Store ERP',
          icon: Package,
          badge: 'Stock'
        },
        {
          id: 'kmfinder',
          label: 'Km Quick Finder',
          shortLabel: 'Km Finder',
          icon: Search,
          badge: 'Finder'
        },
        {
          id: 'staff',
          label: 'Staff Directory',
          shortLabel: 'Staff',
          icon: Users,
          badge: '84'
        }
      ];
    }

    return masterNavItems;
  }, [currentAppRole, role, isSuperAdmin]);

  return (
    <>
      {/* Desktop & Tablet Sidebar (Collapsible: Full w-64 vs Compact w-20) */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-[#081528] border-r border-slate-200 dark:border-[#1e2f47] shrink-0 transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-20 p-2.5' : 'w-64 p-4'
        } space-y-4`}
      >
        {/* User Identity & Collapse Toggle Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2f47]">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                <Train className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase font-bold text-cyan-400 tracking-wider truncate">
                  {currentUser?.role === 'SUPER_ADMIN' ? 'APM / Civil' : currentUser?.role === 'OFFICER' ? 'Officer / P-Way' : 'IMSD SMUN'}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                  {currentUser?.name || 'Shri Vivek Kumar Azad'}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400 shadow-inner" title={`${currentUser?.name} (${currentUser?.designation || 'APM/Civil'})`}>
                <Train className="w-5 h-5" />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleCollapsed}
            className={`p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-[#13243c] border border-transparent hover:border-slate-300 dark:hover:border-[#243b5e] transition ${
              isCollapsed ? 'mt-2 mx-auto block' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Icons'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-cyan-400" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
          {!isCollapsed && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-3 mb-2">
              Operations &amp; Navigation
            </div>
          )}

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (isCollapsed) {
                return (
                  <div key={item.id} className="relative group flex justify-center py-0.5">
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-cyan-400/50'
                          : 'text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-[#122238] border border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                    </button>

                    {/* Hover Floating Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0a182b] text-white text-xs font-bold rounded-xl border border-cyan-500/40 shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 whitespace-nowrap z-50 flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-cyan-300 border border-blue-200 dark:border-blue-500/50 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-cyan-100 hover:bg-slate-100 dark:hover:bg-[#122238]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive
                          ? 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-cyan-300 font-bold border border-transparent dark:border-blue-500/30'
                          : 'bg-slate-100 dark:bg-[#122238] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section Range Info Card */}
        <div className="mt-auto space-y-2 pt-2 border-t border-slate-200 dark:border-[#1e2f47]">
          {!isCollapsed ? (
            <>
              <div className="p-3 bg-slate-50 dark:bg-[#050f1d] border border-slate-200 dark:border-[#1e2f47] rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-cyan-300">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>IMSD SMUN Unit</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Main Line:</span>
                    <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">1167.210 – 1249.720</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Link Line:</span>
                    <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">6.169 Km</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-[#1e2f47]">
                    <span>Total Span:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">88.679 Km</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsAboutOpen(true)}
                className="w-full py-2 px-3 bg-slate-100 dark:bg-[#050f1d] hover:bg-slate-200 dark:hover:bg-[#122238] border border-slate-200 dark:border-[#1e2f47] rounded-xl text-[11px] text-slate-700 dark:text-slate-400 hover:text-blue-700 dark:hover:text-cyan-300 transition flex items-center justify-center gap-1.5 font-bold"
              >
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>About App &amp; Developer</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl bg-[#050f1d] border border-[#1e2f47] flex items-center justify-center text-[10px] font-mono font-black text-emerald-400 cursor-help"
                title="IMSD SMUN Unit: 88.679 Km Span (Main: 1167.210-1249.720 + Link 6.169 Km)"
              >
                88.7K
              </div>
              <button
                onClick={() => setIsAboutOpen(true)}
                className="w-10 h-10 rounded-xl bg-[#050f1d] hover:bg-[#122238] border border-[#1e2f47] flex items-center justify-center text-slate-400 hover:text-cyan-300 transition"
                title="About DFCCIL Rail Diary ERP & Developer"
              >
                <Info className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#071324]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#1e2f47] px-2 py-1.5 shadow-2xl overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center justify-start gap-1.5 min-w-max px-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-semibold transition active:scale-95 shrink-0 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-cyan-300 font-bold border border-blue-200 dark:border-cyan-500/40 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-blue-700 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="whitespace-nowrap">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
};

