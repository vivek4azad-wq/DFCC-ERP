/**
 * DFCCIL Amazon Kindle-Style Mobile & Desktop E-Reader
 * Designed for Immersive Mobile Reading, Touch Gestures, Warm Sepia / Dark Themes & High-DPI Clarity
 * Unit Incharge: Shri Vivek Kumar Azad (APM / Civil, IMSD SMUN)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Bookmark,
  BookmarkCheck,
  List,
  Sliders,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Coffee,
  RotateCcw,
  Download,
  X,
  Volume2,
  VolumeX,
  Grid,
  FileText,
  Sparkles,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Layers,
  Check
} from 'lucide-react';

export interface ManualItem {
  id: string;
  title: string;
  category: 'Core' | 'Track' | 'Installation';
  badge: string;
  date: string;
  url: string;
}

interface KindleManualReaderProps {
  manual: ManualItem;
  manualList: ManualItem[];
  onSelectManual: (manual: ManualItem) => void;
  onOpenAcsModal?: () => void;
  onSwitchTo3DFlipbook?: () => void;
}

type ReadingTheme = 'paper-white' | 'warm-sepia' | 'oled-dark' | 'mint-green';
type ReadingMode = 'single' | 'continuous' | 'two-page';

interface TOCItem {
  title: string;
  page: number;
  part?: string;
}

const MANUAL_TOC_DATA: Record<string, TOCItem[]> = {
  dfc_rrm_final: [
    { title: 'Front Cover & Title Page', page: 1, part: 'Cover' },
    { title: 'Foreword & Leadership Message', page: 4, part: 'Prelude' },
    { title: 'Index & Chapters Overview', page: 6, part: 'Contents' },
    { title: 'Chapter 1: General Organization & Duties', page: 12, part: 'Part I' },
    { title: 'Chapter 2: Track Structure & 60kg Heavy Haul Rail', page: 28, part: 'Part II' },
    { title: 'Chapter 3: Turnouts, Thick Web Switches & CMS Crossings', page: 54, part: 'Part III' },
    { title: 'Chapter 4: Long Welded Rails (LWR/CWR) & SEJ Maintenance', page: 86, part: 'Part IV' },
    { title: 'Chapter 5: Curves, Cant, Super-elevation & Transition', page: 114, part: 'Part V' },
    { title: 'Chapter 6: Track Monitoring, OMS, USFD & Rail Flaw Detection', page: 142, part: 'Part VI' },
    { title: 'Chapter 7: IMSD SMUN Yard, Level Crossings & Safety Devices', page: 172, part: 'Part VII' },
    { title: 'Annexures, Inspection Formats & Correction Slips', page: 192, part: 'Annexures' }
  ],
  dfc_track_manual_2025: [
    { title: 'Title & Edition 2025 Summary', page: 1, part: 'Cover' },
    { title: 'Table of Contents & Revisions', page: 3, part: 'Contents' },
    { title: 'Section 1: 32.5T Axle Load Track Standards', page: 8, part: 'Standards' },
    { title: 'Section 2: Flash Butt & Alumino-Thermic Welding Rules', page: 32, part: 'Welding' },
    { title: 'Section 3: Deep Screening & Heavy Tamping Schedules', page: 68, part: 'Maintenance' },
    { title: 'Section 4: Curve Management & Wear Permissible Limits', page: 102, part: 'Curves' },
    { title: 'Section 5: Inspection Proformas & Gang Performance Logs', page: 135, part: 'Schedules' }
  ],
  lt_wdfc_manual: [
    { title: 'Cover & Applicable Corridor Map', page: 1, part: 'Cover' },
    { title: 'Scope & Technical Specifications', page: 4, part: 'Scope' },
    { title: 'Ballastless & Ballasted Track Installation Guide', page: 18, part: 'Execution' },
    { title: 'Quality Assurance, Tolerances & Handover Checks', page: 45, part: 'QA/QC' }
  ],
  edfcc_installation_manual: [
    { title: 'EDFCC APL-01 Installation Manual R03', page: 1, part: 'Cover' },
    { title: 'Section APL-01: Km 1167.210 – 1249.720 IMSD SMUN', page: 5, part: 'Section' },
    { title: 'P-Way Asset Commissioning & Acceptance Norms', page: 22, part: 'Commissioning' },
    { title: 'Bridge Joints, Expansion Breathers & Level Crossing Layouts', page: 54, part: 'Structures' }
  ]
};

export const KindleManualReader: React.FC<KindleManualReaderProps> = ({
  manual,
  manualList,
  onSelectManual,
  onOpenAcsModal,
  onSwitchTo3DFlipbook
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [theme, setTheme] = useState<ReadingTheme>('warm-sepia');
  const [readingMode, setReadingMode] = useState<ReadingMode>('single');
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ page: number; snippet: string }[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [flipAnimation, setFlipAnimation] = useState<'flip-next' | 'flip-prev' | null>(null);
  const [is3DFlipEffect, setIs3DFlipEffect] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const secondCanvasRef = useRef<HTMLCanvasElement>(null);
  const continuousScrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Load Bookmarks from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kindle_bookmarks_${manual.id}`);
      if (saved) {
        setBookmarks(JSON.parse(saved));
      } else {
        setBookmarks([]);
      }
    } catch (e) {}
  }, [manual.id]);

  const toggleBookmark = (page: number) => {
    let updated: number[];
    if (bookmarks.includes(page)) {
      updated = bookmarks.filter(p => p !== page);
    } else {
      updated = [...bookmarks, page].sort((a, b) => a - b);
    }
    setBookmarks(updated);
    try {
      localStorage.setItem(`kindle_bookmarks_${manual.id}`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Web Audio Sound Effect
  const playFlipSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 0.06;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1600;
      noise.connect(filter);
      filter.connect(ctx.destination);
      noise.start();
    } catch (e) {}
  }, [soundEnabled]);

  // Load PDF with PDF.js
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setLoadingProgress(15);
    setCurrentPage(1);

    const initPdf = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          console.error('PDF.js library not loaded in window');
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument({
          url: manual.url,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true
        });

        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            const pct = Math.min(85, Math.round((progress.loaded / progress.total) * 85));
            setLoadingProgress(pct);
          }
        };

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoadingProgress(100);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load PDF in Kindle reader:', err);
        setLoading(false);
      }
    };

    initPdf();

    return () => {
      isCancelled = true;
    };
  }, [manual.url]);

  // Render Current Page on Canvas
  const renderSinglePage = useCallback(
    async (pageNum: number, targetCanvas: HTMLCanvasElement | null, extraScale = 1) => {
      if (!pdfDoc || !targetCanvas || pageNum < 1 || pageNum > totalPages) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
        const containerHeight = containerRef.current?.clientHeight || window.innerHeight;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const widthScale = (containerWidth - 32) / unscaledViewport.width;
        const heightScale = (containerHeight - 120) / unscaledViewport.height;

        let baseScale = Math.min(widthScale, heightScale);
        if (readingMode === 'two-page') {
          baseScale = Math.min((containerWidth / 2 - 32) / unscaledViewport.width, heightScale);
        }

        const finalScale = Math.max(0.6, baseScale * zoomScale * extraScale);
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = page.getViewport({ scale: finalScale * dpr });

        targetCanvas.width = viewport.width;
        targetCanvas.height = viewport.height;
        targetCanvas.style.width = `${viewport.width / dpr}px`;
        targetCanvas.style.height = `${viewport.height / dpr}px`;

        const ctx = targetCanvas.getContext('2d');
        if (!ctx) return;

        // Draw Paper Background according to theme
        ctx.fillStyle = theme === 'warm-sepia' ? '#faf2e3' : theme === 'mint-green' ? '#f0fdf4' : '#ffffff';
        ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;
      } catch (err) {
        console.warn(`Kindle page ${pageNum} render error:`, err);
      }
    },
    [pdfDoc, totalPages, readingMode, zoomScale, theme]
  );

  useEffect(() => {
    if (!pdfDoc || loading) return;

    if (readingMode === 'single') {
      renderSinglePage(currentPage, canvasRef.current);
    } else if (readingMode === 'two-page') {
      const leftPage = currentPage % 2 === 0 ? currentPage - 1 : currentPage;
      const rightPage = leftPage + 1;
      renderSinglePage(leftPage, canvasRef.current);
      if (rightPage <= totalPages) {
        renderSinglePage(rightPage, secondCanvasRef.current);
      }
    }
  }, [pdfDoc, currentPage, readingMode, zoomScale, theme, loading, renderSinglePage, totalPages]);

  // Page Navigation with 3D Flip Physics
  const goToNextPage = useCallback(() => {
    const step = readingMode === 'two-page' ? 2 : 1;
    if (currentPage + step <= totalPages || currentPage < totalPages) {
      if (is3DFlipEffect) {
        setFlipAnimation('flip-next');
        setTimeout(() => setFlipAnimation(null), 380);
      }
      setCurrentPage(prev => Math.min(totalPages, prev + step));
      playFlipSound();
    }
  }, [currentPage, totalPages, readingMode, playFlipSound, is3DFlipEffect]);

  const goToPrevPage = useCallback(() => {
    const step = readingMode === 'two-page' ? 2 : 1;
    if (currentPage - step >= 1 || currentPage > 1) {
      if (is3DFlipEffect) {
        setFlipAnimation('flip-prev');
        setTimeout(() => setFlipAnimation(null), 380);
      }
      setCurrentPage(prev => Math.max(1, prev - step));
      playFlipSound();
    }
  }, [currentPage, readingMode, playFlipSound, is3DFlipEffect]);

  // Kindle Touch Screen Zone Tap Handler
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    const leftZone = width * 0.25;
    const rightZone = width * 0.75;

    if (clickX < leftZone) {
      goToPrevPage();
    } else if (clickX > rightZone) {
      goToNextPage();
    } else {
      // Center tap toggles immersion mode
      setControlsVisible(prev => !prev);
    }
  };

  // Touch / Swipe Gestures for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe
    if (Math.abs(deltaX) > 40 && Math.abs(deltaY) < 60) {
      if (deltaX < 0) {
        goToNextPage(); // Swiped left -> Next
      } else {
        goToPrevPage(); // Swiped right -> Prev
      }
    }
  };

  // In-Book Text Search
  const performSearch = async (query: string) => {
    if (!pdfDoc || !query || query.trim().length < 2) return;
    setIsSearching(true);
    setSearchResults([]);

    const q = query.toLowerCase().trim();
    const matches: { page: number; snippet: string }[] = [];
    const searchLimit = Math.min(totalPages, 120);

    for (let i = 1; i <= searchLimit; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const fullText = textContent.items.map((item: any) => item.str).join(' ');

        if (fullText.toLowerCase().includes(q)) {
          const idx = fullText.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 45);
          const end = Math.min(fullText.length, idx + q.length + 45);
          matches.push({
            page: i,
            snippet: fullText.substring(start, end)
          });
        }
      } catch (e) {}
    }

    setSearchResults(matches);
    setIsSearching(false);
  };

  // Theme Styles Dictionary
  const themeStyles = {
    'paper-white': {
      bg: 'bg-[#f8f9fa]',
      containerBg: 'bg-[#edeef2]',
      text: 'text-slate-900',
      headerBg: 'bg-white/95 text-slate-900 border-slate-200 shadow-sm',
      footerBg: 'bg-white/95 text-slate-900 border-slate-200 shadow-sm',
      cardBg: 'bg-white',
      accentColor: 'text-[#0f2b5c]',
      border: 'border-slate-200',
      canvasClass: 'shadow-2xl border border-slate-300'
    },
    'warm-sepia': {
      bg: 'bg-[#f4ecd8]',
      containerBg: 'bg-[#e8dcbf]',
      text: 'text-[#3e2d1d]',
      headerBg: 'bg-[#faf3e3]/95 text-[#3e2d1d] border-[#dfcdad] shadow-sm',
      footerBg: 'bg-[#faf3e3]/95 text-[#3e2d1d] border-[#dfcdad] shadow-sm',
      cardBg: 'bg-[#faf3e3]',
      accentColor: 'text-[#8b4513]',
      border: 'border-[#dfcdad]',
      canvasClass: 'shadow-2xl border border-[#d6be95]'
    },
    'oled-dark': {
      bg: 'bg-[#080d1a]',
      containerBg: 'bg-[#04060c]',
      text: 'text-slate-100',
      headerBg: 'bg-[#0e1628]/95 text-white border-slate-800 shadow-md',
      footerBg: 'bg-[#0e1628]/95 text-white border-slate-800 shadow-md',
      cardBg: 'bg-[#131d33]',
      accentColor: 'text-amber-400',
      border: 'border-slate-800',
      canvasClass: 'shadow-2xl border border-slate-800'
    },
    'mint-green': {
      bg: 'bg-[#eef7f0]',
      containerBg: 'bg-[#d8edd9]',
      text: 'text-[#143d1a]',
      headerBg: 'bg-[#f4faf5]/95 text-[#143d1a] border-[#bfe0c2] shadow-sm',
      footerBg: 'bg-[#f4faf5]/95 text-[#143d1a] border-[#bfe0c2] shadow-sm',
      cardBg: 'bg-[#f4faf5]',
      accentColor: 'text-[#0e5720]',
      border: 'border-[#bfe0c2]',
      canvasClass: 'shadow-2xl border border-[#badbbf]'
    }
  };

  const currentTheme = themeStyles[theme];
  const tocList = MANUAL_TOC_DATA[manual.id] || [];

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col overflow-hidden select-none transition-colors duration-300 ${currentTheme.containerBg}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. TOP KINDLE HEADER TOOLBAR (Auto-Hideable) */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 px-3 py-2.5 backdrop-blur-md border-b transition-all duration-300 flex items-center justify-between gap-2 ${
          currentTheme.headerBg
        } ${controlsVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
      >
        {/* Left: Table of Contents & Manual Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsTocOpen(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5"
            title="Table of Contents & Chapters (TOC)"
          >
            <List className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">Contents</span>
          </button>

          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-black truncate leading-tight">
              {manual.title}
            </span>
            <span className="text-[10px] opacity-75 font-semibold">
              Kindle Mobile View &bull; {manual.date}
            </span>
          </div>
        </div>

        {/* Right: Kindle Reader Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* In-Book Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Search inside manual"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => toggleBookmark(currentPage)}
            className={`p-2 rounded-xl transition-colors ${
              bookmarks.includes(currentPage)
                ? 'text-amber-500 bg-amber-500/10'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={bookmarks.includes(currentPage) ? 'Bookmarked' : 'Add Bookmark'}
          >
            {bookmarks.includes(currentPage) ? (
              <BookmarkCheck className="w-4 h-4 fill-amber-500" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {/* Appearance & Themes 'Aa' Menu */}
          <button
            onClick={() => setIsAppearanceOpen(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-xl font-serif text-sm font-black transition-colors border flex items-center gap-1 ${
              isAppearanceOpen
                ? 'bg-amber-400 text-slate-950 border-amber-500'
                : 'hover:bg-black/5 dark:hover:bg-white/10 border-transparent'
            }`}
            title="Reading Themes & Display (Aa)"
          >
            <span>Aa</span>
          </button>

          {/* 3D Flipbook Mode Switcher */}
          {onSwitchTo3DFlipbook && (
            <button
              onClick={onSwitchTo3DFlipbook}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              title="Switch to 3D Realistic Flipbook"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">3D Flipbook</span>
            </button>
          )}

          {/* ACS Correction Slips */}
          {onOpenAcsModal && (
            <button
              onClick={onOpenAcsModal}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
              title="ACS Correction Slips (1-5)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ACS</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN READING STAGE WITH KINDLE TAP ZONES */}
      <div
        onClick={handleStageClick}
        className={`flex-1 w-full h-full flex items-center justify-center overflow-auto relative p-2 sm:p-4 cursor-default ${currentTheme.bg}`}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm text-white">
            <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-3" />
            <span className="text-sm font-bold tracking-wide">
              Loading Kindle Pages ({loadingProgress}%)...
            </span>
          </div>
        )}

        {/* Page Render Canvas Area with 3D Page Turn Physics */}
        <div
          className={`flex items-center justify-center gap-4 max-w-full max-h-full transition-all duration-300 ease-out select-none ${
            flipAnimation === 'flip-next'
              ? 'scale-[0.98] -rotate-1 shadow-2xl opacity-90'
              : flipAnimation === 'flip-prev'
              ? 'scale-[0.98] rotate-1 shadow-2xl opacity-90'
              : 'scale-100 rotate-0 opacity-100'
          }`}
          style={{
            perspective: '1800px',
            transformStyle: 'preserve-3d',
            transform: flipAnimation === 'flip-next'
              ? 'perspective(1800px) rotateY(-8deg) translateX(-12px)'
              : flipAnimation === 'flip-prev'
              ? 'perspective(1800px) rotateY(8deg) translateX(12px)'
              : 'none'
          }}
        >
          <canvas
            ref={canvasRef}
            className={`rounded-lg transition-shadow duration-300 ${currentTheme.canvasClass}`}
          />

          {/* Second Canvas for Two-Page Spread */}
          {readingMode === 'two-page' && currentPage < totalPages && (
            <canvas
              ref={secondCanvasRef}
              className={`rounded-lg transition-shadow duration-300 hidden md:block ${currentTheme.canvasClass}`}
            />
          )}
        </div>

        {/* Floating Side Turn Indicators (Subtle for Mobile) */}
        <button
          onClick={e => {
            e.stopPropagation();
            goToPrevPage();
          }}
          disabled={currentPage <= 1}
          className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-14 rounded-r-2xl bg-black/20 hover:bg-black/40 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all disabled:opacity-0 disabled:pointer-events-none ${
            controlsVisible ? 'opacity-80' : 'opacity-0 hover:opacity-80'
          }`}
          title="Previous Page"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={e => {
            e.stopPropagation();
            goToNextPage();
          }}
          disabled={currentPage >= totalPages}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-14 rounded-l-2xl bg-black/20 hover:bg-black/40 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all disabled:opacity-0 disabled:pointer-events-none ${
            controlsVisible ? 'opacity-80' : 'opacity-0 hover:opacity-80'
          }`}
          title="Next Page"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* 3. BOTTOM KINDLE PROGRESS & SCRUBBER BAR (Auto-Hideable) */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 px-4 py-3 backdrop-blur-md border-t transition-all duration-300 flex flex-col gap-2 ${
          currentTheme.footerBg
        } ${controlsVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
      >
        {/* Scrubber Range Slider & Live Completion Indicator */}
        <div className="flex items-center gap-3 w-full max-w-2xl mx-auto">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={e => setCurrentPage(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-400/40 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry & Page Jump */}
        <div className="flex items-center justify-between text-[11px] font-semibold opacity-85 px-1 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono">
              {Math.round((currentPage / totalPages) * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className="hover:opacity-100 opacity-70 flex items-center gap-1"
              title={soundEnabled ? 'Page Turn Sound: ON' : 'Page Turn Sound: OFF'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound' : 'Mute'}</span>
            </button>

            <span className="text-amber-500 font-bold">
              Tap center to hide bars
            </span>
          </div>
        </div>
      </div>

      {/* 4. KINDLE 'Aa' APPEARANCE & THEME MODAL */}
      {isAppearanceOpen && (
        <div className="absolute top-14 right-3 z-40 w-80 max-w-[calc(100vw-24px)] p-4 rounded-2xl backdrop-blur-xl border shadow-2xl animate-in zoom-in-95 duration-150 bg-slate-900 text-white border-slate-700">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Reading Display Settings (Aa)
            </span>
            <button
              onClick={() => setIsAppearanceOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Themes Grid */}
          <div className="mb-4">
            <label className="text-[11px] font-bold text-slate-300 block mb-2">Reading Themes</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('paper-white')}
                className={`p-2 rounded-xl flex items-center justify-between border text-xs font-bold transition-all ${
                  theme === 'paper-white'
                    ? 'bg-white text-slate-900 border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Paper White</span>
                </div>
                {theme === 'paper-white' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>

              <button
                onClick={() => setTheme('warm-sepia')}
                className={`p-2 rounded-xl flex items-center justify-between border text-xs font-bold transition-all ${
                  theme === 'warm-sepia'
                    ? 'bg-[#f4ecd8] text-[#3e2d1d] border-amber-500 ring-2 ring-amber-400/40'
                    : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-[#8b4513]" />
                  <span>Warm Sepia</span>
                </div>
                {theme === 'warm-sepia' && <Check className="w-3.5 h-3.5 text-[#8b4513]" />}
              </button>

              <button
                onClick={() => setTheme('oled-dark')}
                className={`p-2 rounded-xl flex items-center justify-between border text-xs font-bold transition-all ${
                  theme === 'oled-dark'
                    ? 'bg-black text-white border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>OLED Dark</span>
                </div>
                {theme === 'oled-dark' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <button
                onClick={() => setTheme('mint-green')}
                className={`p-2 rounded-xl flex items-center justify-between border text-xs font-bold transition-all ${
                  theme === 'mint-green'
                    ? 'bg-[#e8f5e9] text-[#1b5e20] border-emerald-500 ring-2 ring-emerald-400/40'
                    : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mint Eye Care</span>
                </div>
                {theme === 'mint-green' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            </div>
          </div>

          {/* Reading Layout Mode */}
          <div className="mb-4">
            <label className="text-[11px] font-bold text-slate-300 block mb-2">Page Layout</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setReadingMode('single')}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  readingMode === 'single'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                📄 Single Page (Mobile)
              </button>

              <button
                onClick={() => setReadingMode('two-page')}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                  readingMode === 'two-page'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                📖 2-Page Spread
              </button>
            </div>
          </div>

          {/* Zoom Scaling */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
              <span>Zoom Scale</span>
              <span className="text-amber-400 font-mono">{Math.round(zoomScale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomScale(prev => Math.max(0.7, prev - 0.15))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={0.7}
                max={2.0}
                step={0.1}
                value={zoomScale}
                onChange={e => setZoomScale(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none accent-amber-400"
              />
              <button
                onClick={() => setZoomScale(prev => Math.min(2.0, prev + 0.15))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TABLE OF CONTENTS & BOOKMARKS DRAWER */}
      {isTocOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-80 max-w-[85vw] h-full bg-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-800 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Table of Contents
                </h3>
                <p className="text-[10px] text-slate-400">{manual.title}</p>
              </div>
              <button
                onClick={() => setIsTocOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Manual Switcher Pills */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/60">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block mb-1.5">
                Switch Manual:
              </span>
              <div className="flex flex-col gap-1">
                {manualList.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectManual(m);
                      setIsTocOpen(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                      manual.id === m.id
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="truncate">{m.badge}</span>
                    <span className="text-[10px] opacity-75">{m.date}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bookmarks Section */}
            {bookmarks.length > 0 && (
              <div className="p-3 border-b border-slate-800 bg-slate-950/40">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Bookmark className="w-3 h-3" />
                  Saved Bookmarks ({bookmarks.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bookmarks.map(page => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        setIsTocOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/40 transition-colors"
                    >
                      Page {page}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TOC Chapters List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {tocList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentPage(item.page);
                    setIsTocOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between ${
                    currentPage >= item.page && (idx === tocList.length - 1 || currentPage < tocList[idx + 1].page)
                      ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    {item.part && (
                      <span className="text-[10px] text-amber-400/80 font-bold block">
                        {item.part}
                      </span>
                    )}
                    <span className="truncate block">{item.title}</span>
                  </div>
                  <span className="text-[11px] font-mono opacity-60">p. {item.page}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsTocOpen(false)} />
        </div>
      )}

      {/* 6. IN-BOOK SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                Search in {manual.badge}
              </h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 mb-4">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && performSearch(searchQuery)}
                placeholder="Type keyword e.g. Curve, CMS, SEJ, Turnout..."
                className="bg-transparent border-0 outline-none text-xs text-white flex-1 placeholder:text-slate-500"
              />
              <button
                onClick={() => performSearch(searchQuery)}
                disabled={isSearching}
                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Search Results List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setCurrentPage(res.page);
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        Page {res.page}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-2">
                      ...{res.snippet}...
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  {isSearching ? 'Scanning document...' : 'Enter keyword to find matching pages and sections.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
