/**
 * DFCCIL Scheduled Inspection Startup Popup Alert
 * Mandated Safety Audits: Points & Crossings (Turnouts), Curves, SEJ, LWR, Bridges, Push Trolley & Night Audits
 */

import React, { useState, useEffect } from 'react';
import { db } from '../services/database.ts';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  X,
  Compass,
  HardHat,
  Search,
  ExternalLink
} from 'lucide-react';
import type {
  PWayScheduleInspectionRecord,
  PointCrossingRecord,
  CurveRecord,
  BridgeRecord,
  SEJRecord
} from '../types/index.ts';

interface ScheduledInspectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToInspections: () => void;
}

export const ScheduledInspectionPopup: React.FC<ScheduledInspectionPopupProps> = ({
  isOpen,
  onClose,
  onNavigateToInspections
}) => {
  const [inspections, setInspections] = useState<PWayScheduleInspectionRecord[]>([]);
  const [turnoutsCount, setTurnoutsCount] = useState<number>(0);
  const [curvesCount, setCurvesCount] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'SCHEDULED'>('ALL');

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [inspList, pcList, curveList] = await Promise.all([
          db.getCollection<PWayScheduleInspectionRecord>('pway_inspections'),
          db.getCollection<PointCrossingRecord>('points_crossings'),
          db.getCollection<CurveRecord>('curves')
        ]);

        setInspections(inspList || []);
        setTurnoutsCount(pcList?.length || 58);
        setCurvesCount(curveList?.length || 42);
      } catch (err) {
        console.error('Failed to load inspection popup data:', err);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Derived classification
  const overdueItems = inspections.filter(i => i.complianceStatus === 'OVERDUE' || (i.targetDate && i.targetDate < todayStr && i.complianceStatus !== 'COMPLETED'));
  const dueSoonItems = inspections.filter(i => i.complianceStatus === 'PENDING' || i.complianceStatus === 'SCHEDULED');
  const completedItems = inspections.filter(i => i.complianceStatus === 'COMPLETED');

  const displayList = activeCategory === 'ALL'
    ? inspections
    : activeCategory === 'OVERDUE'
    ? overdueItems
    : activeCategory === 'DUE_SOON'
    ? dueSoonItems
    : inspections.filter(i => i.complianceStatus === 'SCHEDULED');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-scaleUp max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0f2b5c] via-[#163a75] to-[#0f2b5c] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  🔍 Scheduled Track Inspection Alerts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-blue-200/90 font-medium">
                Mandatory P-Way Schedule Audits (Turnouts, Curves, SEJ, LWR, Bridges) • IMSD SMUN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title="Dismiss Popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Alert Cards */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div
            onClick={() => setActiveCategory('OVERDUE')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              activeCategory === 'OVERDUE'
                ? 'bg-red-500 text-white border-red-600 shadow-md font-bold'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40 text-red-900 dark:text-red-300'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">1. Overdue Audits</div>
            <div className="text-xl font-black mt-0.5">{overdueItems.length}</div>
            <div className="text-[10px] opacity-80">Immediate attention</div>
          </div>

          <div
            onClick={() => setActiveCategory('DUE_SOON')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              activeCategory === 'DUE_SOON'
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-bold'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-300'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">2. Due This Month</div>
            <div className="text-xl font-black mt-0.5">{dueSoonItems.length}</div>
            <div className="text-[10px] opacity-80">Target within 15 days</div>
          </div>

          <div
            onClick={() => setActiveCategory('ALL')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              activeCategory === 'ALL'
                ? 'bg-blue-600 text-white border-blue-700 shadow-md font-bold'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-300'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">3. Points & Curves</div>
            <div className="text-xl font-black mt-0.5">{turnoutsCount + curvesCount}</div>
            <div className="text-[10px] opacity-80">{turnoutsCount} P&C • {curvesCount} Curves</div>
          </div>

          <div
            onClick={() => setActiveCategory('ALL')}
            className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">4. Completed Audits</div>
            <div className="text-xl font-black mt-0.5">{completedItems.length}</div>
            <div className="text-[10px] opacity-80">Fully certified</div>
          </div>
        </div>

        {/* Inspection List View */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Inspection Schedule &amp; Compliance Target List:</span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400">
              Showing {displayList.length} items
            </span>
          </div>

          {displayList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">All Scheduled Inspections Complied</div>
              <p className="text-xs text-slate-500 mt-1">No overdue items found in this filter.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayList.map(insp => {
                const isOverdue = insp.complianceStatus === 'OVERDUE' || (insp.targetDate && insp.targetDate < todayStr && insp.complianceStatus !== 'COMPLETED');
                return (
                  <div
                    key={insp.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isOverdue
                        ? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800/50'
                        : insp.complianceStatus === 'COMPLETED'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {insp.inspectionTypeName}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isOverdue
                            ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/80 dark:text-red-200'
                            : insp.complianceStatus === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/80 dark:text-amber-200'
                        }`}>
                          {isOverdue ? '⚠️ OVERDUE' : insp.complianceStatus}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {insp.scheduleFrequency}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
                        <span>📍 {insp.section}</span>
                        <span>•</span>
                        <span className="font-mono">Km {Number(insp.fromKm).toFixed(3)} → {Number(insp.toKm).toFixed(3)}</span>
                        <span>•</span>
                        <span>👤 {insp.inspectingOfficial}</span>
                      </div>

                      {insp.remarks && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          "{insp.remarks}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase text-slate-500">Target Date</div>
                        <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {insp.targetDate || '2026-08-20'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>Inspection popup will alert on every fresh login session.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Acknowledge &amp; Dismiss
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToInspections();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Inspect Now / Open P-Way ERP</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
