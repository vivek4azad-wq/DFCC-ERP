/**
 * Navigation Sidebar & Mobile Bottom Navigation
 * DFCCIL IMSD SMUN Unit
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
  BookOpen,
  Calculator
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { role, currentAppRole } = useAuth();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const isSuperAdmin = role === 'SUPER_ADMIN' || currentAppRole === 'APM';

  const masterNavItems = [
    // Pillar 1: Executive Command & Spatial Overview
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      shortLabel: 'Dashboard',
      icon: BarChart3,
      badge: 'Infographic'
    },
    {
      id: 'linear',
      label: 'Linear Track Diagram',
      shortLabel: 'Linear',
      icon: Layers,
      badge: '88.68 Km'
    },
    {
      id: 'kmfinder',
      label: 'Km Quick Finder',
      shortLabel: 'Km Finder',
      icon: Search,
      badge: 'Search'
    },
    {
      id: 'gpsmap',
      label: 'DFCCIL GPS Track Map',
      shortLabel: 'GPS Map',
      icon: Compass,
      badge: '144 GPS'
    },

    // Pillar 2: Track Assets & Spatial Master
    {
      id: 'categories',
      label: 'Assets Master Directory',
      shortLabel: 'Assets',
      icon: Grid,
      badge: '8 Groups'
    },
    {
      id: 'keyplans',
      label: 'Station Key-Plans & Layout',
      shortLabel: 'Key-Plans',
      icon: FileText,
      badge: 'CAD / PDF'
    },

    // Pillar 3: P-Way Engineering & Maintenance
    {
      id: 'pway_work',
      label: 'P-Way Quality Inspections',
      shortLabel: 'P-Way',
      icon: Activity,
      badge: 'Quality'
    },
    {
      id: 'maintenance',
      label: 'Track Maintenance Module',
      shortLabel: 'Maintenance',
      icon: Wrench,
      badge: '1+15 Gang'
    },
    {
      id: 'defects',
      label: 'Track Defects & USFD Logs',
      shortLabel: 'Defects',
      icon: AlertTriangle,
      badge: '48 Logs'
    },

    // Pillar 4: Store & Material Logistics (Dedicated Independent Pillar)
    {
      id: 'store',
      label: 'Store & Material Logistics',
      shortLabel: 'Store ERP',
      icon: Package,
      badge: 'Tally Depot'
    },

    // Pillar 5: Personnel ERP & Attendance
    {
      id: 'staff',
      label: 'Staff & Personnel Directory',
      shortLabel: 'Staff ERP',
      icon: Users,
      badge: '84 Staff'
    },
    {
      id: 'attendance',
      label: 'Daily Attendance & Muster',
      shortLabel: 'Attendance',
      icon: CalendarCheck,
      badge: 'Muster Roll'
    },

    // Pillar 6: Technical Software & 3D E-Manuals Hub
    {
      id: 'software',
      label: 'DFCCIL Curve Calculator',
      shortLabel: 'Software',
      icon: Calculator,
      badge: 'VK Azad'
    },
    {
      id: 'manuals',
      label: '3D Track & Railroad Manuals',
      shortLabel: '3D Manuals',
      icon: BookOpen,
      badge: '6 Manuals'
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
      // 🔒 Strictly visible for MTS: KM Finder, P.Way, Maintenance, Staff, and own attendance (No inspection tab)
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
          badge: '82'
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
      // 🔒 Strictly visible for Store Keeper: Store Inventory, KM Finder, and Staff Directory (No inspection tab)
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
          badge: '82'
        }
      ];
    }

    return masterNavItems;
  }, [currentAppRole, role, isSuperAdmin]);

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 space-y-6 transition-colors duration-200">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8] px-3 mb-2">
            Operations &amp; Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-[#7dd3fc] border border-blue-200 dark:border-blue-500/50 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-[#bae6fd] hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700 dark:text-[#38bdf8]' : 'text-slate-500 dark:text-[#94a3b8]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive
                          ? 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-[#7dd3fc] font-bold border border-transparent dark:border-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-[#94a3b8]'
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

        {/* Section Range Info Card */}
        <div className="mt-auto space-y-2">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-[#7dd3fc]">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-[#38bdf8]" />
              <span>IMSD SMUN Unit</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 dark:text-[#94a3b8]">
              <div className="flex justify-between">
                <span>Main Line:</span>
                <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">1167.210 – 1249.720</span>
              </div>
              <div className="flex justify-between">
                <span>Link Line:</span>
                <span className="text-slate-900 dark:text-slate-200 font-mono font-medium">6.169 Km</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Total Span:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">88.679 Km</span>
              </div>
            </div>
          </div>

          {/* About App Developer Link */}
          <button
            onClick={() => setIsAboutOpen(true)}
            className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 rounded-xl text-[11px] text-slate-700 dark:text-[#94a3b8] hover:text-blue-700 dark:hover:text-[#7dd3fc] transition flex items-center justify-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-[#38bdf8]" />
            <span>About App &amp; Developer</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-2xl overflow-x-auto no-scrollbar scroll-smooth">
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
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-[#38bdf8] font-bold border border-blue-200 dark:border-blue-500/40 shadow-sm'
                    : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-blue-700 dark:text-[#38bdf8]' : 'text-slate-500 dark:text-[#94a3b8]'}`} />
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
