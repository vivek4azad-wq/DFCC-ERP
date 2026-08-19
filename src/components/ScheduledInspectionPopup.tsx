/**
 * DFCCIL Low Stock & Zero Inventory Alert Popup
 * Replaces old inspection popup with authentic critical stock audit modal
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  BookOpen,
  ArrowUpRight,
  X,
  Search,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { IMSD_TALLY_GZIP_BASE64 } from '../data/imsdTallyLedgerCompressed.ts';

interface ScheduledInspectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToInspections: () => void;
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
  const [items, setItems] = useState<TallyItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ZERO' | 'LOW' | 'ALL_CRITICAL'>('ALL_CRITICAL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  if (!isOpen) return null;

  const zeroStockItems = items.filter(i => (i.closingBalance ?? 0) <= 0);
  const lowBufferItems = items.filter(i => (i.closingBalance ?? 0) > 0 && (i.closingBalance ?? 0) <= 5);
  const totalCritical = [...zeroStockItems, ...lowBufferItems];

  const filteredList = totalCritical.filter(item => {
    if (activeFilter === 'ZERO' && (item.closingBalance ?? 0) > 0) return false;
    if (activeFilter === 'LOW' && ((item.closingBalance ?? 0) <= 0 || (item.closingBalance ?? 0) > 5)) return false;
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border-2 border-red-500/40 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-scaleUp max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0c234a] via-[#123b72] to-[#0c234a] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/30 border border-red-400/50 rounded-xl text-red-300">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  🚨 Critical Low &amp; Zero Stock Inventory Alerts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Mandatory Safety Buffer &amp; Requisition Trigger • IMSD SMUN Depot (196 Master Items)
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

        {/* 4 Metric KPI Cards */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1 */}
            <button
              type="button"
              onClick={() => setActiveFilter('ZERO')}
              className={`p-3.5 rounded-xl border text-left transition ${
                activeFilter === 'ZERO'
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
                Out of Stock (Nil)
              </div>
            </button>

            {/* Card 2 */}
            <button
              type="button"
              onClick={() => setActiveFilter('LOW')}
              className={`p-3.5 rounded-xl border text-left transition ${
                activeFilter === 'LOW'
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50/50'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                2. Low Buffer Stock
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                {lowBufferItems.length}
              </div>
              <div className="text-[10px] text-amber-600/80 font-bold mt-0.5">
                Below Safety Threshold
              </div>
            </button>

            {/* Card 3 */}
            <button
              type="button"
              onClick={() => setActiveFilter('ALL_CRITICAL')}
              className={`p-3.5 rounded-xl border text-left transition ${
                activeFilter === 'ALL_CRITICAL'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50/50'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                3. Total Items Monitored
              </div>
              <div className="text-2xl font-black text-blue-700 dark:text-cyan-400 mt-0.5">
                {items.length || 196}
              </div>
              <div className="text-[10px] text-blue-600/80 font-bold mt-0.5">
                Tally Ledger Master
              </div>
            </button>

            {/* Card 4 */}
            <div className="p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 text-left">
              <div className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                4. Verified Tally Txns
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                638
              </div>
              <div className="text-[10px] text-emerald-600/80 font-bold mt-0.5">
                Audited &amp; Reconciled
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search low stock materials..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-red-600 font-mono font-black">{filteredList.length}</span> Critical Items
          </div>
        </div>

        {/* Items List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {filteredList.map((item, index) => {
            const isZero = (item.closingBalance ?? 0) <= 0;
            return (
              <div
                key={`${item.sourceFile}-${item.ledgerPage}-${index}`}
                className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isZero
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800/60'
                    : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-blue-700 dark:text-cyan-300 text-xs">
                      {item.sapMaterial || `IMSD-P${item.ledgerPage}`}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {item.itemName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.source} • Page {item.ledgerPage}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                    {item.sapDescription || 'IMSD Material ledger item'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Available Stock</div>
                    <div className={`text-base font-black font-mono ${
                      isZero ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {item.closingBalance ?? 0} {item.sapUom || 'Nos'}
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                    isZero
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-amber-500 text-slate-950 font-bold'
                  }`}>
                    {isZero ? '0 - CRITICAL' : 'LOW BUFFER'}
                  </span>
                </div>
              </div>
            );
          })}

          {!filteredList.length && (
            <div className="p-8 text-center text-slate-500 text-xs font-bold">
              No matching low stock item found for this filter.
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>Store safety buffer triggers are refreshed with authentic IMSD tally master data.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToInspections();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Open Store &amp; Tool Depot ERP</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
