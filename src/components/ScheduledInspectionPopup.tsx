/**
 * DFCCIL IMSD SMUN Critical Alerts & Mandatory Audit Popup
 * Features:
 * 1. 📦 Critical Low & Zero/Negative Stock Inventory Alerts
 * 2. 🚶 Unmanned & Vacant Patrol / Keymen Beats Alerts
 * Displays immediately on app launch for operational safety compliance
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  BookOpen,
  ArrowUpRight,
  X,
  Search,
  Flame,
  ShieldAlert,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  ClipboardCheck
} from 'lucide-react';
import { IMSD_TALLY_GZIP_BASE64 } from '../data/imsdTallyLedgerCompressed.ts';
import { db } from '../services/database.ts';
import { ANNUAL_PWAY_INSPECTION_SCHEDULE } from '../data/annualInspectionSchedule.ts';
import { ShieldCheck, Calendar } from 'lucide-react';
import type { PatrolShiftRecord, KeymanRecord } from '../types/index.ts';

interface ScheduledInspectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToInspections: (targetTab?: string) => void;
}

type TallyItem = {
  source: string;
  sourceFile: string;
  ledgerPage: string;
  itemName: string;
  transactions: number;
  totalReceipt: number;
  totalTransfer: number;
  totalIssue: number;
  closingBalance: number | null;
  indexBalance: number | null;
  sapMaterial: string;
  sapDescription: string;
  sapUom: string;
  matchScore: number;
  matchStatus: string;
  category: string;
};

export const ScheduledInspectionPopup: React.FC<ScheduledInspectionPopupProps> = ({
  isOpen,
  onClose,
  onNavigateToInspections
}) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'VACANT_BEATS' | 'INSPECTIONS'>('STOCK');
  const [items, setItems] = useState<TallyItem[]>([]);
  const [activeStockFilter, setActiveStockFilter] = useState<'ZERO' | 'LOW' | 'ALL_CRITICAL'>('ALL_CRITICAL');
  const [searchQuery, setSearchQuery] = useState('');

  // Vacant Beats Data
  const [vacantPatrols, setVacantPatrols] = useState<PatrolShiftRecord[]>([]);
  const [vacantKeymen, setVacantKeymen] = useState<KeymanRecord[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Load Tally Stock Items
    try {
      const compressed = Uint8Array.from(atob(IMSD_TALLY_GZIP_BASE64), char => char.charCodeAt(0));
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
      new Response(stream).text().then(text => {
        const data = JSON.parse(text);
        setItems(data.items || []);
      });
    } catch (e) {
      console.error('Failed to load tally items for low stock popup:', e);
    }

    // 2. Load Vacant Beats
    const loadBeats = async () => {
      try {
        const [patrols, keymen] = await Promise.all([
          db.getCollection<PatrolShiftRecord>('patrol_shifts'),
          db.getCollection<KeymanRecord>('keymen')
        ]);

        const vacP = patrols.filter(
          p => p.status === 'VACANT' || !p.isFilled || (p.patrolmanName || '').toLowerCase().includes('vacant')
        );
        const vacK = keymen.filter(
          k => !k.keymanName || (k.keymanName || '').toLowerCase().includes('vacant') || (k.status as string) === 'VACANT'
        );

        setVacantPatrols(vacP);
        setVacantKeymen(vacK);
      } catch (err) {
        console.error('Failed to load vacant beats:', err);
      }
    };

    loadBeats();
  }, [isOpen]);

  if (!isOpen) return null;

  const zeroStockItems = items.filter(i => (i.closingBalance ?? 0) <= 0);
  const lowBufferItems = items.filter(i => (i.closingBalance ?? 0) > 0 && (i.closingBalance ?? 0) <= 5);
  const totalCritical = [...zeroStockItems, ...lowBufferItems];

  const filteredStockList = totalCritical.filter(item => {
    if (activeStockFilter === 'ZERO' && (item.closingBalance ?? 0) > 0) return false;
    if (activeStockFilter === 'LOW' && ((item.closingBalance ?? 0) <= 0 || (item.closingBalance ?? 0) > 5)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(q) ||
        (item.sapMaterial && item.sapMaterial.toLowerCase().includes(q)) ||
        item.ledgerPage.includes(q) ||
        item.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalVacantBeatsCount = vacantPatrols.length + vacantKeymen.length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border-2 border-red-500/50 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-scaleUp max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0c234a] via-[#123b72] to-[#0c234a] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/30 border border-red-400/50 rounded-xl text-red-300">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  🚨 DFCCIL IMSD SMUN Operational Safety Alerts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                  MANDATORY AUDIT
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Real-Time Stock Depletion &amp; Unmanned Track Beat Monitoring • Unit Incharge: Shri Vivek Kumar Azad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Low Stock vs Vacant Beats */}
        <div className="px-5 pt-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl border-t border-x transition-all flex items-center gap-2 ${
              activeTab === 'STOCK'
                ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-red-500 shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Critical Low &amp; Zero Stock ({totalCritical.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('VACANT_BEATS')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl border-t border-x transition-all flex items-center gap-2 ${
              activeTab === 'VACANT_BEATS'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-500 shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Unmanned / Vacant Beats ({totalVacantBeatsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('INSPECTIONS')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl border-t border-x transition-all flex items-center gap-2 ${
              activeTab === 'INSPECTIONS'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>P-Way Inspections Due ({new Date().toLocaleString('en-US', { month: 'short' })})</span>
          </button>
        </div>

        {/* TAB 1: LOW & ZERO STOCK INVENTORY */}
        {activeTab === 'STOCK' && (
          <>
            {/* Metric Filter KPI Cards */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStockFilter('ZERO')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activeStockFilter === 'ZERO'
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-500 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/60 hover:bg-red-50/50'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase text-red-600 tracking-wider">
                    1. Zero Stock (0 Balance)
                  </div>
                  <div className="text-2xl font-black text-red-700 dark:text-red-400 mt-0.5">
                    {zeroStockItems.length}
                  </div>
                  <div className="text-[10px] text-red-600/80 font-bold mt-0.5">
                    Nil Stock (Urgent Indent)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStockFilter('LOW')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activeStockFilter === 'LOW'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                    2. Low Buffer (&le; 5 Units)
                  </div>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                    {lowBufferItems.length}
                  </div>
                  <div className="text-[10px] text-amber-600/80 font-bold mt-0.5">
                    Critical Reserve Reached
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStockFilter('ALL_CRITICAL')}
                  className={`col-span-2 sm:col-span-1 p-3 rounded-xl border text-left transition ${
                    activeStockFilter === 'ALL_CRITICAL'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                    3. Total Critical Items
                  </div>
                  <div className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-0.5">
                    {totalCritical.length}
                  </div>
                  <div className="text-[10px] text-blue-600/80 font-bold mt-0.5">
                    Combined Low / Zero Items
                  </div>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mt-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by item name, SAP material code, tally page..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Stock List Scrollable Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredStockList.map((item, idx) => {
                const isZero = (item.closingBalance ?? 0) <= 0;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-red-400/50 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isZero ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
                        }`}>
                          {isZero ? 'NIL STOCK' : 'LOW BUFFER'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Tally Page: {item.ledgerPage}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.source}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.itemName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        SAP: {item.sapMaterial || 'Standard Store Material'} &bull; Category: {item.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Balance</span>
                        <span className={`text-lg font-black font-mono ${
                          isZero ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {item.closingBalance ?? 0} {item.sapUom || 'Nos'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: UNMANNED & VACANT BEATS */}
        {activeTab === 'VACANT_BEATS' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  {totalVacantBeatsCount} Unmanned or Vacant Track Beats detected across IMSD SMUN Jurisdiction.
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToInspections('staff');
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition shrink-0"
              >
                Go to Staff Roster ➔
              </button>
            </div>

            {/* Vacant Patrol Shifts */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <span>Vacant Patrol Shifts ({vacantPatrols.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {vacantPatrols.length === 0 ? (
                  <div className="col-span-2 p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl text-center text-xs text-slate-400">
                    All patrol shifts are fully manned!
                  </div>
                ) : (
                  vacantPatrols.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-amber-300/60 dark:border-amber-500/30 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                            {p.beatCode || `Beat ${idx + 1}`}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {p.section || 'Main Line'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          Km {p.fromKm} &ndash; {p.toKm} &bull; {p.shiftType} Shift
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                        VACANT
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Vacant Keymen Beats */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <span>Vacant Keymen Beats ({vacantKeymen.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {vacantKeymen.length === 0 ? (
                  <div className="col-span-2 p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl text-center text-xs text-slate-400">
                    All Keymen beats are assigned!
                  </div>
                ) : (
                  vacantKeymen.map((k, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-950 border border-amber-300/60 dark:border-amber-500/30 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                          Keyman Beat {k.beatNo || idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          Km {k.fromKm} &ndash; {k.toKm} &bull; {k.assignedSection}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                        UNASSIGNED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MONTHLY P-WAY INSPECTIONS DUE */}
        {activeTab === 'INSPECTIONS' && (() => {
          const currentMonthNum = new Date().getMonth() + 1;
          const monthPlan = ANNUAL_PWAY_INSPECTION_SCHEDULE.find(m => m.monthIndex === currentMonthNum) || ANNUAL_PWAY_INSPECTION_SCHEDULE[8];

          return (
            <div className="p-5 overflow-y-auto space-y-4 max-h-[60vh]">
              <div className="p-4 bg-gradient-to-r from-blue-900 to-[#123b72] text-white rounded-2xl shadow-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase">
                    Current Active Month • {monthPlan.monthName}
                  </span>
                  <span className="text-xs font-mono text-blue-200">IRPWM &amp; DFCCIL Track Schedule</span>
                </div>
                <h4 className="text-sm md:text-base font-black">
                  IMSD In-Charge (APM/Civil Shri Vivek Kumar Azad) &amp; Sectional Plan
                </h4>
                <p className="text-xs text-blue-100">
                  मेन लाइन टर्नआउट्स (3 माह चक्रीय), लूप लाइन (वार्षिक संपूर्ण स्टेशन ऑडिट), जॉइंट S&amp;T व 100% कर्व्स का सटीक मासिक लक्ष्य।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* In-Charge Plan */}
                <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-400/50 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800 pb-2">
                    <span className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>In-Charge Obligations ({monthPlan.monthShort})</span>
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Shri Vivek Kumar Azad</span>
                  </div>

                  <div className="text-xs space-y-2">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800">
                      <strong className="text-blue-800 dark:text-blue-300 block">🔀 Main Line Points ({monthPlan.incharge.mainLinePoints.frequencyRule}):</strong>
                      <span className="font-bold text-slate-800 dark:text-white">{monthPlan.incharge.mainLinePoints.stationName}</span>
                      <span className="text-slate-500 font-mono text-[11px] block">{monthPlan.incharge.mainLinePoints.pointsCount} Points • {monthPlan.incharge.mainLinePoints.turnoutSummary}</span>
                    </div>

                    {monthPlan.incharge.loopLinePoints && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-300 dark:border-emerald-800">
                        <strong className="text-emerald-800 dark:text-emerald-300 block">🔄 Loop Line Points (Annual Audit):</strong>
                        <span className="font-bold text-slate-800 dark:text-white">{monthPlan.incharge.loopLinePoints.stationName} ({monthPlan.incharge.loopLinePoints.pointsCount} Points)</span>
                        <span className="text-emerald-700 dark:text-emerald-400 text-[11px] block">{monthPlan.incharge.loopLinePoints.rationale}</span>
                      </div>
                    )}

                    <div className="p-2 bg-cyan-50 dark:bg-cyan-950/50 rounded-xl border border-cyan-300 dark:border-cyan-800">
                      <strong className="text-cyan-800 dark:text-cyan-300 block">📡 Joint P&amp;C with S&amp;T:</strong>
                      <span className="font-bold text-slate-800 dark:text-white">{monthPlan.incharge.jointST.stationName}</span>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px] block">Joint Officer: {monthPlan.incharge.jointST.jointOfficial}</span>
                    </div>

                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl border border-indigo-300 dark:border-indigo-800">
                      <strong className="text-indigo-800 dark:text-indigo-300 block">📐 In-Charge Curves:</strong>
                      <span className="font-bold text-slate-800 dark:text-white">{monthPlan.incharge.curves.rangeText} ({monthPlan.incharge.curves.count} Curves)</span>
                      <span className="text-slate-500 text-[11px] block">{monthPlan.incharge.curves.description}</span>
                    </div>
                  </div>
                </div>

                {/* Sectional Plan */}
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-400/50 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                      <span>Sectional Obligations ({monthPlan.monthShort})</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">SSE / JE P-Way</span>
                  </div>

                  <div className="text-xs space-y-2">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <strong className="text-emerald-800 dark:text-emerald-300 block">📐 Sectional Complementary Curves:</strong>
                      <span className="font-bold text-slate-800 dark:text-white">{monthPlan.sectional.curves.rangeText} ({monthPlan.sectional.curves.count} Curves)</span>
                      <span className="text-slate-500 text-[11px] block">{monthPlan.sectional.curves.description}</span>
                    </div>

                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <strong className="text-slate-800 dark:text-slate-200 block">🛠️ Sectional Routine Duties:</strong>
                      <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                        {monthPlan.sectional.routineTasks.map((t, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            DFCCIL IMSD SMUN &bull; Real-time Safety Audit Popup
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Dismiss (बंद करें)
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToInspections(activeTab === 'STOCK' ? 'store' : activeTab === 'VACANT_BEATS' ? 'staff' : 'pway_work');
              }}
              className={`px-4 py-2 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center gap-1.5 ${
                activeTab === 'STOCK'
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                  : activeTab === 'VACANT_BEATS'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              <span>
                {activeTab === 'STOCK'
                  ? 'Open Store ERP'
                  : activeTab === 'VACANT_BEATS'
                    ? 'Open Staff Directory'
                    : 'Open P-Way Annual Inspections'}
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
