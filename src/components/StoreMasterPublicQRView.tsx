/**
 * DFCCIL IMSD SMUN Whole Store & Inventory Master Public Live QR View
 * Opened when mobile phone scans the Store Master QR Code
 * Real-time synced with DFCCIL IMSD SMUN Database
 */

import React, { useState, useEffect } from 'react';
import { db } from '../services/database.ts';
import {
  Package,
  Search,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Share2,
  Printer,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Clock
} from 'lucide-react';
import type { StoreItemRecord, StoreTransactionRecord } from '../types/index.ts';

interface StoreMasterPublicQRViewProps {
  onBackToApp?: () => void;
}

export const StoreMasterPublicQRView: React.FC<StoreMasterPublicQRViewProps> = ({ onBackToApp }) => {
  const [items, setItems] = useState<StoreItemRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadAllStoreData = async () => {
    try {
      setIsLoading(true);
      const [storeItems, storeInv] = await Promise.all([
        db.getCollection<StoreItemRecord>('store_items'),
        db.getCollection<StoreItemRecord>('store_inventory')
      ]);

      const mergedMap = new Map<string, StoreItemRecord>();
      [...storeItems, ...storeInv].forEach(item => {
        if (item.id) mergedMap.set(item.id, item);
      });

      setItems(Array.from(mergedMap.values()));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load whole store master inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllStoreData();
    const unsub = db.subscribe(() => {
      loadAllStoreData();
    });
    return () => unsub();
  }, []);

  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category || 'General')))];

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'ALL' || (item.category || 'General') === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const totalStockQty = items.reduce((acc, curr) => acc + (curr.currentStock || 0), 0);
  const lowStockCount = items.filter(i => (i.currentStock || 0) <= (i.minBufferThreshold || 5)).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-3 sm:p-6 animate-fadeIn">
      {/* Top DFCCIL Official Header */}
      <div className="max-w-5xl w-full mx-auto bg-gradient-to-r from-[#0a1e3f] via-[#123363] to-[#0a1e3f] border-2 border-amber-400/40 rounded-3xl p-4 sm:p-6 shadow-2xl mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-400/20 shrink-0">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  Official Live Register
                </span>
                <span className="text-xs text-amber-200/80 font-mono font-bold">
                  IMSD SMUN • Ambala Unit
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                DFCCIL Whole Store Inventory &amp; Stock Master
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Dedicated Freight Corridor Corporation of India Limited
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Ledger</span>
            </button>
            <button
              onClick={loadAllStoreData}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-400/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Live Sync</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-center">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-2xl font-black text-white block">{items.length}</span>
            <span className="text-xs font-bold text-slate-300 block">Total Catalog Items</span>
            <span className="text-[10px] text-slate-400">P-Way, Fasteners &amp; T&amp;P</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-2xl font-black text-emerald-400 block">{totalStockQty.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-300 block">Total Current Units</span>
            <span className="text-[10px] text-slate-400">Available in Depot</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-2xl font-black text-amber-400 block">{lowStockCount}</span>
            <span className="text-xs font-bold text-slate-300 block">Low / Buffer Alerts</span>
            <span className="text-[10px] text-slate-400">&le; Minimum Threshold</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-center gap-1 text-cyan-300 text-xs font-bold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Real-Time Sync</span>
            </div>
            <span className="text-xs font-mono text-slate-200 block">
              {lastUpdated.toLocaleTimeString()}
            </span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase">
              • Database Connected
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Inventory Table Container */}
      <div className="max-w-5xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex-1 flex flex-col">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search material, code, bay location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 overflow-y-auto flex-1 pr-1">
          {filteredItems.map(item => {
            const isLow = (item.currentStock || 0) <= (item.minBufferThreshold || 5);
            return (
              <div
                key={item.id}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-amber-300 border border-slate-700">
                          {item.itemCode || item.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold truncate">
                          {item.category || 'General'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug break-words">
                        {item.name}
                      </h3>
                      {item.specification && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {item.specification}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xl font-black block font-mono ${
                        isLow ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {(item.currentStock || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {item.unit || 'Nos'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 mt-2">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Location</span>
                      <span className="text-slate-300 font-medium truncate block">{item.location || 'Depot Bay'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Buffer Min</span>
                      <span className="text-slate-300 font-mono font-medium block">{item.minBufferThreshold || 5} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Total Inward</span>
                      <span className="text-emerald-400 font-mono font-bold block">+{item.inwardTotal || 0}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase">Total Outward</span>
                      <span className="text-amber-400 font-mono font-bold block">-{item.outwardTotal || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">
                    Supplier: <strong className="text-slate-300">{item.supplier || 'SAIL / DFCCIL Central'}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    isLow ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isLow ? 'Low Buffer Alert' : 'Stock Adequate'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Official DFCCIL IMSD SMUN Unit • Unit Incharge: Shri Vivek Kumar Azad (APM / Civil)</span>
          <span className="text-amber-400 font-semibold">Corridor: Km 1167.210 – 1249.720</span>
        </div>
      </div>
    </div>
  );
};
