/**
 * 3D E-Manuals & Advance Correction Slips (ACS) Interactive Flipbook
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
  Bookmark
} from 'lucide-react';

interface ManualItem {
  id: string;
  title: string;
  category: 'Manual' | 'ACS' | 'Turnout' | 'P&C' | 'Online';
  badge: string;
  date?: string;
  url: string;
  isExternal?: boolean;
}

const MANUAL_CATALOG: ManualItem[] = [
  {
    id: 'dfc_rrm_final',
    title: 'DFC Railroad Manual (Final Official)',
    category: 'Manual',
    badge: 'Core Manual',
    date: '2025',
    url: '/manuals/DFC_RAILROAD_MANUAL_Final.pdf'
  },
  {
    id: 'acs_01',
    title: 'ACS-01 DFC Railroad Manual',
    category: 'ACS',
    badge: 'ACS 01',
    date: '25.06.2025',
    url: '/manuals/ACS_01_DFC_RRM_25.06.2025.pdf'
  },
  {
    id: 'acs_02',
    title: 'ACS-02 DFC Railroad Manual',
    category: 'ACS',
    badge: 'ACS 02',
    date: '08.08.2025',
    url: '/manuals/ACS_02_DFC_Railroad_Manual.pdf'
  },
  {
    id: 'acs_03',
    title: 'ACS-03 to DFC Railroad Manual',
    category: 'ACS',
    badge: 'ACS 03',
    date: '2025',
    url: '/manuals/ACS_03_to_DFC_RRM.pdf'
  },
  {
    id: 'acs_04',
    title: 'ACS-04 to DFC Railroad Manual',
    category: 'ACS',
    badge: 'ACS 04',
    date: '16.10.2025',
    url: '/manuals/ACS_04_dt_16.10.2025.pdf'
  },
  {
    id: 'acs_05',
    title: 'ACS-05 to DFC Railroad Manual',
    category: 'ACS',
    badge: 'ACS 05',
    date: '02.12.2025',
    url: '/manuals/ACS_05_dt_02.12.25_RRM.pdf'
  },
  {
    id: 'dfc_track_manual_2025',
    title: 'DFC Track Manual 2025 (Final)',
    category: 'Manual',
    badge: 'Track 2025',
    date: '2025',
    url: '/manuals/DFC_Track_manual_2025_Final.pdf'
  },
  {
    id: 'vossloh_manual',
    title: 'Vossloh Turnout Maintenance Manual',
    category: 'Turnout',
    badge: 'Turnout',
    date: 'Feb 2025',
    url: '/manuals/Vossloh_TO_Maintenance_Manual.pdf'
  },
  {
    id: 'reconditioning_booklet',
    title: 'Booklet on Reconditioning of Points & Crossing',
    category: 'P&C',
    badge: 'P&C',
    date: 'Feb 2025',
    url: '/manuals/Booklet_on_Reconditioning_of_Points_and_Crossing.pdf'
  },
  {
    id: 'mm_steel_reconditioning',
    title: 'Manual for Reconditioning MM Steel Points & Crossings',
    category: 'P&C',
    badge: 'Welding',
    date: 'IRICEN/RDSO',
    url: '/manuals/Manual_for_Reconditioning_of_MM_Steel_Points_and_Crossings.pdf'
  },
  {
    id: 'iricen_turnout_online',
    title: 'IRICEN Turnout 2025 (Official Online Flipbook)',
    category: 'Online',
    badge: 'IRICEN Live',
    date: 'Dec 2025',
    url: 'https://www.iricen.gov.in/iricen/books_jquery/Turnout%202025/index.html',
    isExternal: true
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

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-3 animate-in fade-in duration-300">
      {/* Top Banner & Fast ACS Selector */}
      <div className="bg-gradient-to-r from-[#0f2b5c] via-[#163a75] to-[#071733] border border-[#233f75] rounded-2xl p-4 shadow-xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
            <BookOpen className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                3D HTML5 E-Manuals & Correction Slips
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold uppercase tracking-wider">
                  3D Flip
                </span>
              </h1>
            </div>
            <p className="text-xs text-amber-200/80 font-medium">
              Realistic Page-Turn Physics • Audio Feedback • Instant Clause & Table Search
            </p>
          </div>
        </div>

        {/* Quick ACS Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-300 mr-1 hidden sm:inline">ACS Fast Jump:</span>
          {MANUAL_CATALOG.filter(b => b.category === 'ACS').map(acs => (
            <button
              key={acs.id}
              onClick={() => handleSelectBook(acs)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shadow-sm ${
                selectedBook.id === acs.id
                  ? 'bg-amber-400 text-slate-950 shadow-amber-400/40 ring-2 ring-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
              }`}
            >
              {acs.badge}
            </button>
          ))}
          <button
            onClick={() => handleSelectBook(MANUAL_CATALOG.find(b => b.id === 'iricen_turnout_online')!)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white transition-all border border-emerald-400/30 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" /> IRICEN 2025
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
              placeholder="Filter manuals & slips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-dfccil-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {['ALL', 'Manual', 'ACS', 'Turnout', 'P&C'].map(cat => (
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
                        book.category === 'ACS'
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                          : book.category === 'Manual'
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
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
          <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xs font-bold text-white truncate max-w-[320px] sm:max-w-md">
                {selectedBook.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
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
                title="Download Original PDF"
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
