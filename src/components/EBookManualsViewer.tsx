/**
 * 3D Track & Railroad Manuals Library (Interactive Flipbook)
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  ExternalLink,
  Download,
  Maximize2,
  RefreshCw,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Bookmark,
  Calculator
} from 'lucide-react';

interface ManualItem {
  id: string;
  title: string;
  category: 'Core' | 'Track' | 'Turnout' | 'Installation' | 'Maintenance';
  badge: string;
  date?: string;
  url: string;
  isExternal?: boolean;
}

const MANUAL_CATALOG: ManualItem[] = [
  {
    id: 'dfc_rrm_final',
    title: 'DFC Railroad Manual (Final Official)',
    category: 'Core',
    badge: 'Railroad Manual',
    date: 'Final Edition',
    url: '/manuals/DFC_RAILROAD_MANUAL_Final.pdf'
  },
  {
    id: 'dfc_track_manual_2025',
    title: 'DFC Track Manual 2025 (Final)',
    category: 'Track',
    badge: 'Track Manual 2025',
    date: '2025',
    url: '/manuals/DFC_Track_manual_2025_Final.pdf'
  },
  {
    id: 'vossloh_manual',
    title: 'Vossloh Turnout Maintenance Manual',
    category: 'Turnout',
    badge: 'Vossloh Manual',
    date: '2025',
    url: '/manuals/Vossloh_TO_Maintenance_Manual.pdf'
  },
  {
    id: 'lt_wdfc_manual',
    title: 'L&T Track Manual Applicable for WDFC',
    category: 'Track',
    badge: 'L&T Manual',
    date: 'WDFC Applicable',
    url: '/manuals/LT_Track_Manual_Applicable_for_WDFC.pdf'
  },
  {
    id: 'edfcc_installation_manual',
    title: 'Installation Manual EDFCC APL-01 (R03)',
    category: 'Installation',
    badge: 'Installation Manual',
    date: 'APL-01 (R03)',
    url: '/manuals/Installation_Manual_EDFCC_APL_01.pdf'
  },
  {
    id: 'mm_steel_reconditioning',
    title: 'Manual for Reconditioning MM Steel Points & Crossings',
    category: 'Maintenance',
    badge: 'P&C Manual',
    date: 'IRICEN / RDSO',
    url: '/manuals/Manual_for_Reconditioning_of_MM_Steel_Points_and_Crossings.pdf'
  }
];

export const EBookManualsViewer: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<ManualItem>(MANUAL_CATALOG[0]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const filteredBooks = MANUAL_CATALOG.filter(book => {
    const matchesCat = activeCategory === 'ALL' || book.category === activeCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectBook = (book: ManualItem) => {
    setSelectedBook(book);
    setIframeKey(prev => prev + 1);
  };

  const getViewerUrl = () => {
    if (selectedBook.isExternal) {
      return selectedBook.url;
    }
    return `/flipbook/index.html?book=${selectedBook.id}`;
  };

  const handleOpenCalculator = () => {
    window.open('/calculator/index.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-3 animate-in fade-in duration-300">
      {/* Top Banner & Fast Manual Selector */}
      <div className="bg-gradient-to-r from-[#0f2b5c] via-[#163a75] to-[#071733] border border-[#233f75] rounded-2xl p-3.5 sm:p-4 shadow-xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <BookOpen className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                3D Track & Railroad Manuals
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold uppercase tracking-wider">
                  6 Manuals
                </span>
              </h1>
            </div>
            <p className="text-xs text-amber-200/80 font-medium">
              Realistic Page-Turn Physics • Audio Turn Sound • Search & Zoom
            </p>
          </div>
        </div>

        {/* Quick Manual Selector Chips & Curve Calculator Launcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {MANUAL_CATALOG.map(manual => (
              <button
                key={manual.id}
                onClick={() => handleSelectBook(manual)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shadow-sm ${
                  selectedBook.id === manual.id
                    ? 'bg-amber-400 text-slate-950 shadow-amber-400/40 ring-2 ring-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                }`}
              >
                {manual.badge}
              </button>
            ))}
          </div>

          {/* Dedicated Calculator Button */}
          <button
            onClick={handleOpenCalculator}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-300/40 flex items-center gap-1.5 transition-all hover:scale-105"
            title="Open DFCCIL Railway Curve Calculator in New Window"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Curve Calculator ↗</span>
          </button>
        </div>
      </div>

      {/* Main Container: Sidebar Manuals List + 3D Stage Viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Book Catalog Selector (3 cols on large screens) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col shadow-sm min-h-0 overflow-hidden">
          {/* Search Box */}
          <div className="relative mb-2.5">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter manuals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-dfccil-500"
            />
          </div>

          {/* Software Tools Card */}
          <div
            onClick={handleOpenCalculator}
            className="mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 border border-sky-200 dark:border-sky-800/80 cursor-pointer hover:border-sky-400 transition-all flex items-center justify-between gap-2 shadow-xs group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Calculator className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-sky-900 dark:text-sky-200 truncate">
                  DFCCIL Curve Calculator
                </div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                  By V K Azad • Click to Open Software
                </div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {['ALL', 'Core', 'Track', 'Turnout', 'Installation', 'Maintenance'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-dfccil-900 dark:bg-dfccil-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Manuals Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredBooks.map(book => {
              const isSelected = selectedBook.id === book.id;
              return (
                <div
                  key={book.id}
                  onClick={() => handleSelectBook(book)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all border text-left flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600/50 shadow-sm'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        book.category === 'Core'
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                          : book.category === 'Track'
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300'
                      }`}>
                        {book.badge}
                      </span>
                      {book.date && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {book.date}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs font-bold leading-snug line-clamp-2 ${
                      isSelected ? 'text-slate-900 dark:text-amber-200' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {book.title}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 mt-1 flex-shrink-0 transition-transform ${
                    isSelected ? 'text-amber-500 translate-x-0.5' : 'text-slate-400'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 3D Flipbook Stage Viewport (9 cols) */}
        <div className="lg:col-span-9 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl relative">
          {/* Header Action Bar on Top of Flipbook */}
          <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xs font-bold text-white truncate max-w-[320px] sm:max-w-md">
                {selectedBook.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleOpenCalculator}
                className="px-2 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 text-sky-300 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 border border-sky-600/40"
                title="Open Curve Calculator"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calculator</span>
              </button>
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Reload Flipbook"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <a
                href={selectedBook.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
                title="Download Original PDF Manual"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </a>
              <a
                href={getViewerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors text-xs flex items-center gap-1 shadow-sm"
                title="Open Standalone Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </a>
            </div>
          </div>

          {/* Flipbook Iframe Shell */}
          <div className="flex-1 w-full h-full bg-[#0a0f1d] relative">
            <iframe
              key={iframeKey}
              src={getViewerUrl()}
              className="w-full h-full border-0 absolute inset-0"
              title={selectedBook.title}
              allow="fullscreen"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
