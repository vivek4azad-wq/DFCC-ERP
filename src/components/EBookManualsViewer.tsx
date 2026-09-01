/**
 * DFCCIL 3D Track & Railroad Manuals Viewer
 * High-Performance 3D Flipbook Experience
 * 100% Full-Stage Viewport with Fast Progressive Rendering
 * Unit Incharge: Shri Vivek Kumar Azad (APM / Civil)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
  FileCheck,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  HelpCircle,
  Volume2
} from 'lucide-react';

interface ManualItem {
  id: string;
  title: string;
  category: 'Core' | 'Track' | 'Installation';
  badge: string;
  date: string;
  url: string;
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
    url: '/manuals/ACS_02_DFC_RRM.pdf'
  },
  {
    id: 'acs-03',
    title: 'ACS-03: DFC Railroad Manual',
    shortTitle: 'ACS 03',
    date: '2025',
    size: '1.4 MB',
    url: '/manuals/ACS_03_DFC_RRM.pdf'
  },
  {
    id: 'acs-04',
    title: 'ACS-04: DFC Railroad Manual',
    shortTitle: 'ACS 04',
    date: '2025',
    size: '850 KB',
    url: '/manuals/ACS_04_DFC_RRM.pdf'
  },
  {
    id: 'acs-05',
    title: 'ACS-05: DFC Railroad Manual',
    shortTitle: 'ACS 05',
    date: '2025',
    size: '1.2 MB',
    url: '/manuals/ACS_05_DFC_RRM.pdf'
  }
];

export const EBookManualsViewer: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<ManualItem>(MANUAL_CATALOG[0]);
  const [isAcsModalOpen, setIsAcsModalOpen] = useState(false);
  const [useDirectPdfFallback, setUseDirectPdfFallback] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const handleSelectBook = (manual: ManualItem) => {
    setSelectedBook(manual);
    setIframeKey(prev => prev + 1);
  };

  const getViewerUrl = () => {
    if (useDirectPdfFallback) {
      return selectedBook.url;
    }
    return `/flipbook/index.html?book=${selectedBook.id}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (viewerContainerRef.current?.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen().catch(err => {
          console.warn('Native fullscreen failed, opening standalone window:', err);
          window.open(getViewerUrl(), '_blank', 'noopener,noreferrer');
        });
      } else {
        window.open(getViewerUrl(), '_blank', 'noopener,noreferrer');
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={viewerContainerRef}
      className={`flex flex-col w-full gap-3 animate-in fade-in duration-300 ${
        isFullscreen ? 'h-screen p-3 bg-[#070c18]' : 'h-[calc(100vh-120px)]'
      }`}
    >
      {/* Top Banner & Fast Manual Selector */}
      <div className="bg-gradient-to-r from-[#0f2b5c] via-[#163a75] to-[#071733] border border-[#233f75] rounded-2xl p-3 sm:p-4 shadow-xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <BookOpen className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                3D Track &amp; Railroad Manuals
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black uppercase tracking-wider">
                  4 Official Manuals
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-amber-200/80 font-medium">
              Realistic 3D Page-Turn Physics &bull; Web Audio Sound &bull; Progressive Loading
            </p>
          </div>
        </div>

        {/* Action Buttons: Fast Manual Selection Chips & ACS Download */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Manual Selector Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {MANUAL_CATALOG.map(manual => (
              <button
                key={manual.id}
                onClick={() => handleSelectBook(manual)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
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

      {/* Main 100% Full-Stage 3D Viewport Container */}
      <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-0 relative">
        {/* Stage Header Toolbar */}
        <div className="p-2 sm:p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-slate-100 truncate text-xs sm:text-sm">
              {selectedBook.title}
            </span>
            <span className="text-[10px] text-amber-400 font-mono hidden sm:inline bg-slate-800 px-2 py-0.5 rounded">
              {selectedBook.date}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsAcsModalOpen(true)}
              className="px-2 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 border border-emerald-600/40"
              title="Download Correction Slips"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ACS Slips</span>
            </button>

            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Reload Flipbook"
            >
              <RotateCw className="w-3.5 h-3.5" />
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

            <button
              onClick={toggleFullscreen}
              className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black transition-all text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 active:scale-95"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Flipbook Iframe Shell (Takes 100% Full Stage) */}
        <div className="flex-1 w-full h-full bg-[#0a0f1d] relative">
          <iframe
            key={iframeKey}
            src={getViewerUrl()}
            className="w-full h-full border-0 absolute inset-0"
            title={selectedBook.title}
            allow="fullscreen *; autoplay; clipboard-read; clipboard-write"
          />
        </div>
      </div>

      {/* ACS Correction Slips Direct Download Modal */}
      {isAcsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
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
              {ACS_SLIPS_LIST.map(acs => (
                <div
                  key={acs.id}
                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-colors"
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
                      download
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-sm"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Official DFCCIL IMSD SMUN Unit</span>
              <button
                onClick={() => setIsAcsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
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
