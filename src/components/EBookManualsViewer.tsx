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
  Calculator,
  FileCheck,
  X
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

interface ACSCorrectionSlip {
  id: string;
  title: string;
  shortTitle: string;
  date: string;
  size: string;
  url: string;
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
  }
];

const ACS_SLIPS_LIST: ACSCorrectionSlip[] = [
  {
    id: 'acs-01',
    title: 'ACS-01: DFC Railroad Manual (dt. 25.06.2025)',
    shortTitle: 'ACS 01',
    date: '25-Jun-2025',
    size: '790 KB',
    url: '/manuals/ACS_01_DFC_RRM_25.06.2025.pdf'
  },
  {
    id: 'acs-02',
    title: 'ACS-02: DFC Railroad Manual',
    shortTitle: 'ACS 02',
    date: '2025',
    size: '2.1 MB',
    url: '/manuals/ACS_02_DFC_Railroad_Manual.pdf'
  },
  {
    id: 'acs-03',
    title: 'ACS-03: Addendum & Correction Slip to DFC RRM',
    shortTitle: 'ACS 03',
    date: '2025',
    size: '812 KB',
    url: '/manuals/ACS_03_to_DFC_RRM.pdf'
  },
  {
    id: 'acs-04',
    title: 'ACS-04: DFC Railroad Manual (dt. 16.10.2025)',
    shortTitle: 'ACS 04',
    date: '16-Oct-2025',
    size: '3.0 MB',
    url: '/manuals/ACS_04_dt_16.10.2025.pdf'
  },
  {
    id: 'acs-05',
    title: 'ACS-05: DFC Railroad Manual (dt. 02.12.2025)',
    shortTitle: 'ACS 05',
    date: '02-Dec-2025',
    size: '795 KB',
    url: '/manuals/ACS_05_dt_02.12.25_RRM.pdf'
  }
];

export const EBookManualsViewer: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<ManualItem>(MANUAL_CATALOG[0]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [isAcsModalOpen, setIsAcsModalOpen] = useState(false);

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
                3D Track &amp; Railroad Manuals
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold uppercase tracking-wider">
                  4 Official Manuals
                </span>
              </h1>
            </div>
            <p className="text-xs text-amber-200/80 font-medium">
              Realistic Page-Turn Physics • Audio Turn Sound • Search &amp; Zoom
            </p>
          </div>
        </div>

        {/* Action Buttons: Fast Manuals & ACS Slips Download */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Manual Selector Chips */}
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

          {/* Direct ACS Download Modal Trigger */}
          <button
            onClick={() => setIsAcsModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 border border-emerald-400/40 flex items-center gap-1.5 transition-all hover:scale-105"
            title="Download Correction Slips (ACS 1 to 5)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ACS Slips (1-5) ⬇</span>
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

          {/* Correction Slips Quick Download Card */}
          <div className="mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Correction Slips (ACS)</span>
              </div>
              <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold px-1.5 py-0.5 rounded">
                Direct PDF
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300/90 mb-2 leading-relaxed">
              Click any slip below to download original PDF directly:
            </p>
            <div className="grid grid-cols-5 gap-1">
              {ACS_SLIPS_LIST.map(acs => (
                <a
                  key={acs.id}
                  href={acs.url}
                  download
                  className="px-1 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold text-center text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-all flex flex-col items-center justify-center shadow-2xs"
                  title={`${acs.title} (${acs.size}) - Click to Download`}
                >
                  <span>{acs.shortTitle}</span>
                  <span className="text-[8px] opacity-75 font-normal">PDF ⬇</span>
                </a>
              ))}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {['ALL', 'Core', 'Track', 'Installation'].map(cat => (
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
                onClick={() => setIsAcsModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 border border-emerald-600/40"
                title="Download Correction Slips"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ACS Slips</span>
              </button>
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

      {/* ACS Correction Slips Direct Download Modal */}
      {isAcsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">DFC Railroad Manual Correction Slips</h3>
                  <p className="text-xs text-slate-400">Direct 1-Click PDF Downloads (ACS 01 to 05)</p>
                </div>
              </div>
              <button
                onClick={() => setIsAcsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {ACS_SLIPS_LIST.map((acs, idx) => (
                <div
                  key={acs.id}
                  className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {acs.shortTitle}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">
                        {acs.date}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({acs.size})
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {acs.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={acs.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors flex items-center gap-1"
                      title="Open PDF in browser"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                    <a
                      href={acs.url}
                      download
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm"
                      title="Download PDF directly"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsAcsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
