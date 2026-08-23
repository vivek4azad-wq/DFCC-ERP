/**
 * Comprehensive Linear Track Diagram & Connected Gradient Profile
 * Matches authentic DFCCIL IMSD SMUN Portal theme & design
 * Covers: Km 1167.210 → Km 1249.720 (82.510 Km Main Line) + Link Line (6.169 Km)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../services/database.ts';
import { launchNavigation } from '../services/geo.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { BridgeDetailModal } from './BridgeDetailModal.tsx';
import { StaffIdModal, type UnifiedStaffModalData } from './StaffIdModal.tsx';
import { GRADIENT_RECORDS } from '../data/gradientData.ts';
import {
  Train,
  MapPin,
  Navigation,
  Compass,
  Search,
  Filter,
  Layers,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import type {
  BridgeRecord,
  PointCrossingRecord,
  CurveRecord,
  LevelCrossingRecord,
  LWRRecord,
  SEJRecord,
  KeymanRecord,
  PatrolShiftRecord,
  StationRecord
} from '../types/index.ts';

const STATIONS: StationRecord[] = [
  { id: 'STN-UBCD', code: 'UBCD', name: 'New Ambala City', chainage: 1158.856, km: 1158.856, latitude: 30.36480047, longitude: 76.78420970 },
  { id: 'STN-SMUN', code: 'SMUN', name: 'New Shambhu Jn.', chainage: 1170.435, km: 1170.435, latitude: 30.43845483, longitude: 76.66757351 },
  { id: 'STN-SBJN', code: 'SBJN', name: 'New Sarai Banjara', chainage: 1188.575, km: 1188.575, latitude: 30.53744193, longitude: 76.51726774 },
  { id: 'STN-NSIR', code: 'NSIR', name: 'New Sirhind Jn.', chainage: 1202.015, km: 1202.015, latitude: 30.61047362, longitude: 76.40613096 },
  { id: 'STN-GVGN', code: 'GVGN', name: 'New Mandi Gobindgarh', chainage: 1213.187, km: 1213.187, latitude: 30.65781158, longitude: 76.31939408 },
  { id: 'STN-KNNN', code: 'KNNN', name: 'New Khanna', chainage: 1229.087, km: 1229.087, latitude: 30.73240010, longitude: 76.17824291 },
  { id: 'STN-CHAN', code: 'CHAN', name: 'New Chawa Pail Jn.', chainage: 1235.837, km: 1235.837, latitude: 30.77249243, longitude: 76.10268950 },
  { id: 'STN-SNL', code: 'SNL', name: 'New Sanahwal / Doraha', chainage: 1249.700, km: 1249.700, latitude: 30.82992131, longitude: 75.99446589 },
  { id: 'STN-RPJ', code: 'RPJ', name: 'Rajpura Detour (Link Line)', chainage: 1178.150, km: 1178.150, latitude: 30.47997302, longitude: 76.60357716 }
];

const SECTIONS = [
  { id: 'ALL', name: 'All Corridor (Km 1167.210 – 1249.720)', minKm: 1167.210, maxKm: 1249.720 },
  { id: 'KRJN-SMUN', name: 'KRJN–SMUN (Km 1167.210 – 1170.435)', minKm: 1167.210, maxKm: 1170.435 },
  { id: 'SMUN-SBJN', name: 'SMUN–SBJN (Km 1170.435 – 1188.575)', minKm: 1170.435, maxKm: 1188.575 },
  { id: 'SBJN-NSIR', name: 'SBJN–NSIR (Km 1188.575 – 1202.015)', minKm: 1188.575, maxKm: 1202.015 },
  { id: 'NSIR-GVGN', name: 'NSIR–GVGN (Km 1202.015 – 1213.187)', minKm: 1202.015, maxKm: 1213.187 },
  { id: 'GVGN-KNNN', name: 'GVGN–KNNN (Km 1213.187 – 1229.087)', minKm: 1213.187, maxKm: 1229.087 },
  { id: 'KNNN-CHAN', name: 'KNNN–CHAN (Km 1229.087 – 1235.837)', minKm: 1229.087, maxKm: 1235.837 },
  { id: 'CHAN-SNL', name: 'CHAN–SNL (Km 1235.837 – 1249.720)', minKm: 1235.837, maxKm: 1249.720 },
  { id: 'SMUN-RPJ', name: 'SMUN–RPJ Link (Km 1168.697 – 1178.150)', minKm: 1168.697, maxKm: 1178.150 }
];

export interface LinearAssetItem {
  id: string;
  type: 'Bridge' | 'PC' | 'Curve' | 'LC' | 'LWR' | 'SEJ' | 'Keyman' | 'Patrol' | 'Station';
  km: number;
  label: string;
  subLabel: string;
  badge: string;
  color: string;
  cssClass: string;
  isLink?: boolean;
  latitude?: number;
  longitude?: number;
  raw: any;
}

export const BridgeLinearDiagram: React.FC = () => {
  const { isDark } = useTheme();
  const [bridges, setBridges] = useState<BridgeRecord[]>([]);
  const [pointsCrossings, setPointsCrossings] = useState<PointCrossingRecord[]>([]);
  const [curves, setCurves] = useState<CurveRecord[]>([]);
  const [levelCrossings, setLevelCrossings] = useState<LevelCrossingRecord[]>([]);
  const [lwrList, setLwrList] = useState<LWRRecord[]>([]);
  const [sejList, setSejList] = useState<SEJRecord[]>([]);
  const [keymen, setKeymen] = useState<KeymanRecord[]>([]);
  const [patrolShifts, setPatrolShifts] = useState<PatrolShiftRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const diagramContainerRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'connected' | 'gradient_vertical'>('connected');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [pxPerKm, setPxPerKm] = useState<number>(248);

  const [selectedSection, setSelectedSection] = useState('ALL');
  const [activeRange, setActiveRange] = useState<{ minKm: number; maxKm: number; label: string }>({
    minKm: 1167.210,
    maxKm: 1249.720,
    label: 'All Corridor (Km 1167.210 – 1249.720)'
  });
  const [fromKmInput, setFromKmInput] = useState('1167.210');
  const [toKmInput, setToKmInput] = useState('1249.720');
  const [centerKmInput, setCenterKmInput] = useState('');
  const [gradientDirectionFilter, setGradientDirectionFilter] = useState<'ALL' | 'RISE' | 'FALL' | 'LEVEL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedBridgeForModal, setSelectedBridgeForModal] = useState<BridgeRecord | null>(null);
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<UnifiedStaffModalData | null>(null);

  const [layers, setLayers] = useState({
    bridges: true,
    points_crossings: true,
    curves: true,
    level_crossings: true,
    lwr: true,
    sej: true,
    stations: true,
    beats: true,
    embankment: true
  });

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const selectAllLayers = (val: boolean) => {
    setLayers({
      bridges: val,
      points_crossings: val,
      curves: val,
      level_crossings: val,
      lwr: val,
      sej: val,
      stations: val,
      beats: val,
      embankment: val
    });
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [brg, pc, crv, lc, lwr, sej, km, pat] = await Promise.all([
        db.getCollection<BridgeRecord>('bridges'),
        db.getCollection<PointCrossingRecord>('points_crossings'),
        db.getCollection<CurveRecord>('curves'),
        db.getCollection<LevelCrossingRecord>('level_crossings'),
        db.getCollection<LWRRecord>('lwr'),
        db.getCollection<SEJRecord>('sej'),
        db.getCollection<KeymanRecord>('keymen'),
        db.getCollection<PatrolShiftRecord>('patrol_shifts')
      ]);
      setBridges(brg);
      setPointsCrossings(pc);
      setCurves(crv);
      setLevelCrossings(lc);
      setLwrList(lwr);
      setSejList(sej);
      setKeymen(km);
      setPatrolShifts(pat);
    } catch (err) {
      console.error('Failed to load linear diagram datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const unsub = db.subscribe(() => {
      loadAllData();
    });
    return () => {
      unsub();
    };
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (centerKmInput.trim()) {
      const c = parseFloat(centerKmInput);
      if (!isNaN(c)) {
        const min = Math.max(1150, c - 2.5);
        const max = Math.min(1260, c + 2.5);
        setActiveRange({ minKm: min, maxKm: max, label: `Center Km ${c.toFixed(3)} (±2.5 Km)` });
        setSelectedSection('CUSTOM');
        setFromKmInput(min.toFixed(3));
        setToKmInput(max.toFixed(3));
        return;
      }
    }
    const f = parseFloat(fromKmInput);
    const t = parseFloat(toKmInput);
    if (!isNaN(f) && !isNaN(t)) {
      const min = Math.min(f, t);
      const max = Math.max(f, t);
      setActiveRange({ minKm: min, maxKm: max, label: `Km ${min.toFixed(3)} → ${max.toFixed(3)}` });
      setSelectedSection('CUSTOM');
    }
  };

  const handleReset = () => {
    const all = SECTIONS[0];
    setSelectedSection('ALL');
    setActiveRange({ minKm: all.minKm, maxKm: all.maxKm, label: all.name });
    setFromKmInput(all.minKm.toFixed(3));
    setToKmInput(all.maxKm.toFixed(3));
    setCenterKmInput('');
    setSearchQuery('');
  };

  const handleZoomIn = () => {
    setPxPerKm(prev => Math.min(600, Math.round(prev * 1.25)));
  };

  const handleZoomOut = () => {
    setPxPerKm(prev => Math.max(48, Math.round(prev / 1.25)));
  };

  const allLinearAssets: LinearAssetItem[] = useMemo(() => {
    const list: LinearAssetItem[] = [];

    if (layers.bridges) {
      bridges.forEach(b => {
        const km = Number(b.fromKm !== undefined ? b.fromKm : b.km);
        const bType = (b.type || 'Minor').toUpperCase();
        const typeClass = bType.includes('MJB') || bType.includes('MAJOR') ? 'bridge mjb'
          : bType.includes('RUB') ? 'bridge rub'
          : bType.includes('ROB') ? 'bridge rob'
          : bType.includes('FOB') ? 'bridge fob'
          : bType.includes('OWG') ? 'bridge owg'
          : 'bridge mib';

        const isLink = (b.section || '').includes('RPJ') || (b.section || '').includes('Link') || (km > 1170.435 && km < 1178.15 && (b.bridgeNo || '').includes('L'));

        list.push({
          id: `brg-${b.id}`,
          type: 'Bridge',
          km,
          label: `Bridge ${b.bridgeNo}`,
          subLabel: `${b.type || 'Minor'} · Old Br: ${b.oldBridgeNo || '-'}`,
          badge: `🌉 Br ${b.bridgeNo}`,
          color: '#2563eb',
          cssClass: typeClass + (isLink ? ' link' : ''),
          isLink,
          latitude: b.latitude,
          longitude: b.longitude,
          raw: b
        });
      });
    }

    if (layers.points_crossings) {
      pointsCrossings.forEach(p => {
        const km = Number(p.srjChainage || p.km || 0);
        list.push({
          id: `pc-${p.id}`,
          type: 'PC',
          km,
          label: `Point ${p.pointNo || p.point_no}`,
          subLabel: `${p.station || p.station_code || 'SMUN'} · ${p.line || 'Main Line'} · ${p.crossingAngle || '1 in 12'}`,
          badge: `🛤️ Pt ${p.pointNo || p.point_no}`,
          color: '#16a34a',
          cssClass: 'pc',
          raw: p
        });
      });
    }

    if (layers.curves) {
      curves.forEach(c => {
        const km = Number(c.fromKm !== undefined ? c.fromKm : c.km);
        list.push({
          id: `crv-${c.id}`,
          type: 'Curve',
          km,
          label: `Curve ${c.curveNo || c.curve_no}`,
          subLabel: `${Number(c.fromKm || 0).toFixed(3)}-${Number(c.toKm || 0).toFixed(3)} · ${c.degreeOfCurve || c.degree || '-'}°`,
          badge: `🔄 C#${c.curveNo || c.curve_no}`,
          color: '#f59e0b',
          cssClass: 'curve',
          raw: c
        });
      });
    }

    if (layers.level_crossings) {
      levelCrossings.forEach(lc => {
        const km = Number(lc.km !== undefined ? lc.km : (lc.chainage || 0));
        list.push({
          id: `lc-${lc.id}`,
          type: 'LC',
          km,
          label: `LC-${lc.gateNo || lc.lc_no}`,
          subLabel: `Km ${km.toFixed(3)} · ${lc.classification || 'Special'}`,
          badge: `🚥 LC ${lc.gateNo || lc.lc_no}`,
          color: '#dc2626',
          cssClass: 'lc',
          raw: lc
        });
      });
    }

    if (layers.lwr) {
      lwrList.forEach(l => {
        const km = Number(l.fromKm !== undefined ? l.fromKm : l.from);
        list.push({
          id: `lwr-${l.id}`,
          type: 'LWR',
          km,
          label: `LWR ${l.lwrNo || l.lwr_no}`,
          subLabel: `Km ${Number(l.fromKm || l.from || 0).toFixed(3)}-${Number(l.toKm || l.to || 0).toFixed(3)}`,
          badge: `🚆 LWR ${l.lwrNo || l.lwr_no}`,
          color: '#7c3aed',
          cssClass: 'lwr',
          raw: l
        });
      });
    }

    if (layers.sej) {
      sejList.forEach(s => {
        const km = Number(s.chainage || s.srj_chainage || 0);
        list.push({
          id: `sej-${s.id}`,
          type: 'SEJ',
          km,
          label: `SEJ ${s.sejNo || s.sej_no}`,
          subLabel: `${s.section || 'SMUN-SBJN'} · Km ${km.toFixed(3)}`,
          badge: `🔧 SEJ ${s.sejNo || s.sej_no}`,
          color: '#db2777',
          cssClass: 'sej',
          raw: s
        });
      });
    }

    return list;
  }, [layers, bridges, pointsCrossings, curves, levelCrossings, lwrList, sejList]);

  const filteredAssets = useMemo(() => {
    return allLinearAssets
      .filter(item => {
        const inSec = item.km >= activeRange.minKm - 0.05 && item.km <= activeRange.maxKm + 0.05;
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          item.label.toLowerCase().includes(q) ||
          item.subLabel.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q) ||
          String(item.km).includes(q);
        return inSec && matchSearch;
      })
      .sort((a, b) => a.km - b.km);
  }, [allLinearAssets, activeRange, searchQuery]);

  const filteredGradients = useMemo(() => {
    return GRADIENT_RECORDS.filter(g => {
      const start = parseFloat(g.startKm) / 1000;
      const end = parseFloat(g.endKm) / 1000;
      const inRange = end >= activeRange.minKm && start <= activeRange.maxKm;
      const matchDir = gradientDirectionFilter === 'ALL' || g.direction === gradientDirectionFilter;
      return inRange && matchDir;
    });
  }, [activeRange, gradientDirectionFilter]);

  const handleAssetClick = (item: LinearAssetItem) => {
    if (item.type === 'Bridge') {
      setSelectedBridgeForModal(item.raw);
    } else if (item.type === 'Keyman') {
      setSelectedStaffForModal({
        name: item.raw.name,
        awpoId: item.raw.awpoId,
        mobileNo: item.raw.mobileNo,
        otherMobileNo: item.raw.otherMobileNo,
        fatherName: item.raw.fatherName,
        beatNoText: `Beat ${item.raw.beatNo}`,
        beatCode: item.raw.beatCode,
        fromKm: item.raw.fromKm,
        toKm: item.raw.toKm,
        residence: item.raw.residence,
        district: item.raw.district,
        category: 'Ex-Serviceman',
        post: 'Keyman'
      });
    } else if (item.type === 'Patrol') {
      setSelectedStaffForModal({
        name: item.raw.patrolmanName || '',
        awpoId: item.raw.patrolmanStaffId || '',
        mobileNo: item.raw.patrolmanPhone || '',
        beatCode: item.raw.beatCode,
        fromKm: item.raw.fromKm,
        toKm: item.raw.toKm,
        post: item.raw.shiftType === 'DAY' ? 'Day Security Patrolman' : 'Night Security Patrolman',
        category: 'Ex-Serviceman'
      });
    } else if (item.type === 'LC') {
      const gList = item.raw.gatemen || [];
      const primaryGateman = gList[0];
      setSelectedStaffForModal({
        name: primaryGateman?.name || `Gateman (LC ${item.raw.gateNo || item.raw.lc_no})`,
        awpoId: primaryGateman?.id || '46536',
        mobileNo: primaryGateman?.mobile || '9478553153',
        fatherName: primaryGateman?.fatherName || '-',
        beatNoText: `Gate ${item.raw.gateNo || item.raw.lc_no}`,
        beatCode: `LC-${item.raw.gateNo || item.raw.lc_no}`,
        fromKm: item.raw.km || item.raw.chainage,
        toKm: item.raw.km || item.raw.chainage,
        sectionCode: item.raw.sectionCode || item.raw.section,
        post: 'Gate Keeper / Gateman',
        category: 'Ex-Serviceman'
      });
    } else if (item.latitude && item.longitude) {
      launchNavigation(item.latitude, item.longitude, item.label);
    }
  };

  const kmFrom = Math.floor(activeRange.minKm);
  const kmTo = Math.ceil(activeRange.maxKm);
  const totalKmSpan = Math.max(0.5, kmTo - kmFrom);

  const canvasHeight = Math.max(700, Math.round(totalKmSpan * pxPerKm + 140));
  const getY = (km: number) => 50 + (km - kmFrom) * pxPerKm;

  return (
    <div className={`space-y-4 animate-fadeIn pb-12 print-container ${isFullScreen ? 'fixed inset-0 z-50 bg-[#f8fafc] dark:bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-linear-diagram,
          #printable-linear-diagram * {
            visibility: visible !important;
          }
          #printable-linear-diagram {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8px !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
          }
          .v14-wrap {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            border: 1px solid #94a3b8 !important;
            background: #ffffff !important;
          }
          .v14-canvas {
            background: #ffffff !important;
          }
          .no-print, nav, header, footer {
            display: none !important;
          }
        }
      `}</style>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 no-print">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>📐</span>
              <span>DFCCIL PKY-SNL — KM-wise Linear Diagram</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Same asset database as KM Search, shown on one chainage line.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('connected')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                viewMode === 'connected'
                  ? 'bg-[#123b72] text-white border-[#123b72] shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Connected Profile
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gradient_vertical')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                viewMode === 'gradient_vertical'
                  ? 'bg-[#123b72] text-white border-[#123b72] shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Gradient Diagram ({GRADIENT_RECORDS.length})
            </button>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">From KM</label>
            <input
              type="number"
              step="0.001"
              value={fromKmInput}
              onChange={e => {
                setFromKmInput(e.target.value);
                setCenterKmInput('');
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition shadow-inner font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">To KM</label>
            <input
              type="number"
              step="0.001"
              value={toKmInput}
              onChange={e => {
                setToKmInput(e.target.value);
                setCenterKmInput('');
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition shadow-inner font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Center KM</label>
            <input
              type="number"
              step="0.001"
              placeholder="Optional"
              value={centerKmInput}
              onChange={e => {
                setCenterKmInput(e.target.value);
                setFromKmInput('');
                setToKmInput('');
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition shadow-inner placeholder:text-slate-400 font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#123b72] hover:bg-[#1a4f9c] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>📐</span>
            <span>Generate</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition flex items-center justify-center active:scale-95"
          >
            <span>Reset</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 print-include"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Diagram Only</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          <strong>Linear view:</strong> Bridges, P&amp;C, Curves, LWR, SEJ, LC, Stations, Keyman and Patrol beats are placed at their exact chainages. Click any asset node to open its details.
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-1">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{bridges.length || 144}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">Bridge</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{curves.length || 95}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">Curve</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{pointsCrossings.length || 41}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">P&amp;C</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{STATIONS.length - 1}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">Station</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{sejList.length || 13}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">SEJ</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{lwrList.length || 6}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">LWR</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{levelCrossings.length || 5}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">LC</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-left">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{GRADIENT_RECORDS.length}</div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">Gradient</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <button
            type="button"
            onClick={() => selectAllLayers(true)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white font-bold rounded-lg transition"
          >
            ✓ All
          </button>

          <button
            type="button"
            onClick={() => selectAllLayers(false)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('bridges')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.bridges ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.bridges ? <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>Bridges ({bridges.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('points_crossings')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.points_crossings ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.points_crossings ? <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>Main P&amp;C ({pointsCrossings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('curves')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.curves ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.curves ? <CheckSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>Curves ({curves.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('level_crossings')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.level_crossings ? 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.level_crossings ? <CheckSquare className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>LC ({levelCrossings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('lwr')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.lwr ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.lwr ? <CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>LWR ({lwrList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('sej')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.sej ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.sej ? <CheckSquare className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>SEJ ({sejList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('stations')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.stations ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.stations ? <CheckSquare className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" /> : <Square className="w-3.5 h-3.5" />}
            <span>Stations ({STATIONS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('beats')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.beats ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.beats ? <CheckSquare className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>K / P Beats</span>
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('embankment')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
              layers.embankment ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {layers.embankment ? <CheckSquare className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>⛰️ Embankment (1173.5–1177.8)</span>
          </button>
        </div>
      </div>

      {viewMode === 'connected' && (
        <div id="printable-linear-diagram" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              Km {kmFrom.toFixed(3)} → Km {kmTo.toFixed(3)} · Height: {canvasHeight}px
            </span>
            <span className="text-xs font-mono font-black text-blue-700 dark:text-cyan-400">
              {filteredAssets.length} Assets in Range
            </span>
          </div>

          <div
            ref={diagramContainerRef}
            className="v14-wrap bg-white dark:bg-[#070c18] border border-slate-200 dark:border-slate-800"
            style={{
              maxHeight: isFullScreen ? 'calc(100vh - 120px)' : '850px',
              backgroundColor: isDark ? '#070c18' : '#ffffff'
            }}
          >
            <div
              className="v14-canvas bg-white dark:bg-[#070c18]"
              style={{
                height: `${canvasHeight}px`,
                backgroundColor: isDark ? '#070c18' : '#ffffff'
              }}
            >
              <div className="v14-track-a" />
              <div className="v14-track-b" />

              {/* ⛰️ High Embankment Zone (Km 1173.500 – 1177.800) */}
              {layers.embankment && 1177.800 >= kmFrom && 1173.500 <= kmTo && (() => {
                const embStartY = getY(Math.max(kmFrom, 1173.500));
                const embEndY = getY(Math.min(kmTo, 1177.800));
                const embHeight = Math.max(24, embEndY - embStartY);
                return (
                  <React.Fragment key="high-embankment-zone">
                    <div
                      className="v14-high-embankment animate-pulse"
                      style={{
                        top: `${embStartY}px`,
                        height: `${embHeight}px`
                      }}
                      title="High Embankment Zone (Km 1173.500 to Km 1177.800)"
                    />
                    <div
                      className="v14-embankment-label cursor-pointer"
                      style={{ top: `${embStartY + 6}px` }}
                      title="High Embankment (Length: 4.300 Km | Km 1173.500 – 1177.800)"
                    >
                      ⛰️ High Embankment (Ch. 1173.500 – 1177.800)
                    </div>
                  </React.Fragment>
                );
              })()}

              {Array.from({ length: Math.ceil(totalKmSpan) + 1 }).map((_, i) => {
                const k = kmFrom + i;
                if (k > kmTo) return null;
                const topY = getY(k);
                return (
                  <React.Fragment key={`km-${k}`}>
                    <div className="v14-kmline" style={{ top: `${topY}px` }} />
                    <div className="v14-kmtext" style={{ top: `${topY}px` }}>
                      KM {k}
                    </div>
                  </React.Fragment>
                );
              })}

              {layers.stations &&
                STATIONS.filter(st => st.km >= kmFrom && st.km <= kmTo).map(st => {
                  const topY = getY(st.km);
                  return (
                    <React.Fragment key={st.code}>
                      <div className="v14-station-line" style={{ top: `${topY}px` }} />
                      <div
                        className="v14-station-name cursor-pointer hover:bg-red-50 transition"
                        style={{ top: `${topY}px` }}
                        onClick={() => launchNavigation(st.latitude, st.longitude, st.name)}
                        title={`Click to Navigate to ${st.name} in Google Maps`}
                      >
                        {st.code} — {st.name} · Km {st.km.toFixed(3)}
                      </div>
                    </React.Fragment>
                  );
                })}

              {(() => {
                const lastY: Record<string, number> = { L0: -999, L1: -999, R0: -999, R1: -999 };
                let flip = 0;

                return filteredAssets.map(asset => {
                  if (asset.type === 'Station') return null;
                  const yy = getY(asset.km);
                  const isLeft = flip++ % 2 === 0;
                  const keys = isLeft ? ['L0', 'L1'] : ['R0', 'R1'];
                  const key = keys.find(k => yy - (lastY[k] || -999) > 48) || keys[0];
                  lastY[key] = yy;

                  const topAsset = Math.max(2, yy - 18);
                  const sideClass = isLeft ? 'left' : 'right';
                  const leftPos = isLeft
                    ? key.endsWith('1') ? '655px' : '600px'
                    : key.endsWith('1') ? '875px' : '830px';

                  return (
                    <React.Fragment key={asset.id}>
                      <div
                        className={`v14-asset ${sideClass} ${asset.cssClass}`}
                        style={{
                          top: `${topAsset}px`,
                          left: leftPos
                        }}
                        onClick={() => handleAssetClick(asset)}
                        title={`${asset.label}\n${asset.subLabel}\nKm ${asset.km.toFixed(3)} (Click for details)`}
                      >
                        <strong>{asset.label}</strong>
                        <span className="text-[10px] text-slate-600 block leading-tight truncate">{asset.subLabel}</span>
                      </div>

                      <div
                        className="v14-connector"
                        style={{
                          top: `${yy}px`,
                          left: isLeft ? '540px' : '528px',
                          width: isLeft ? (key.endsWith('1') ? '115px' : '60px') : (key.endsWith('1') ? '347px' : '302px')
                        }}
                      />
                    </React.Fragment>
                  );
                });
              })()}

              {layers.beats && (
                <>
                  {keymen.map((km, idx) => {
                    const fromY = getY(Math.max(kmFrom, km.fromKm));
                    const toY = getY(Math.min(kmTo, km.toKm));
                    if (toY <= fromY) return null;
                    const right = 12 + (idx % 2) * 105;

                    return (
                      <div
                        key={km.id}
                        className="v14-beat key cursor-pointer hover:shadow-md"
                        style={{
                          top: `${fromY}px`,
                          height: `${Math.max(22, toY - fromY)}px`,
                          right: `${right}px`
                        }}
                        onClick={() => handleAssetClick({ type: 'Keyman', raw: km } as any)}
                        title={`${km.name} (${km.beatNoText})\nKm ${km.fromKm.toFixed(3)} → ${km.toKm.toFixed(3)}`}
                      >
                        <div>{km.beatNoText}</div>
                        <div className="font-bold text-[9px] truncate">{km.name}</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'gradient_vertical' && (
        <div id="printable-linear-diagram" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Vertical Linear Gradient Diagram</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-mono font-bold">
                  {filteredGradients.length} Segments
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Official PVI Chainage, Slope Ratio, Elevations and Bend Curvature across corridor.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setGradientDirectionFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition border ${
                  gradientDirectionFilter === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setGradientDirectionFilter('RISE')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 border ${
                  gradientDirectionFilter === 'RISE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>↗ RISE bend</span>
              </button>

              <button
                type="button"
                onClick={() => setGradientDirectionFilter('FALL')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 border ${
                  gradientDirectionFilter === 'FALL'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>↘ FALL bend</span>
              </button>

              <button
                type="button"
                onClick={() => setGradientDirectionFilter('LEVEL')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 border ${
                  gradientDirectionFilter === 'LEVEL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>│ LEVEL</span>
              </button>
            </div>
          </div>

          <div className="v143-grid max-h-[800px] overflow-y-auto pr-1">
            {filteredGradients.map((item, idx) => {
              const startKmNum = (parseFloat(item.startKm) / 1000).toFixed(3);
              const endKmNum = (parseFloat(item.endKm) / 1000).toFixed(3);
              const arrow = item.direction === 'RISE' ? '↗' : item.direction === 'FALL' ? '↘' : '│';
              const gradRatio = item.gradient === '0' ? 'LEVEL' : `1 in ${Math.abs(Number(item.gradient))}`;

              return (
                <div key={`grad-${item.sl}-${idx}`} className="v143-row">
                  <div className="v143-chainage">
                    <div>{startKmNum}</div>
                    <div className="text-slate-400 text-[10px]">to {endKmNum}</div>
                  </div>

                  <div className="v143-track">
                    {item.direction === 'RISE' ? (
                      <svg viewBox="0 0 44 60" preserveAspectRatio="none">
                        <path d="M22 0 L22 20 L35 40 L35 60" />
                        <circle className="bend-dot" cx="22" cy="20" r="3" />
                      </svg>
                    ) : item.direction === 'FALL' ? (
                      <svg viewBox="0 0 44 60" preserveAspectRatio="none">
                        <path d="M22 0 L22 20 L9 40 L9 60" />
                        <circle className="bend-dot" cx="22" cy="20" r="3" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 44 60" preserveAspectRatio="none">
                        <path d="M22 0 L22 60" />
                      </svg>
                    )}
                  </div>

                  <div className={`v143-info ${item.direction}`}>
                    <b>{arrow} {gradRatio}</b>
                    {item.isLinkLine && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px] uppercase font-mono shadow-sm">
                        🔗 SMUN–RPJ LINK LINE
                      </span>
                    )}
                    <div className="v143-meta">
                      Elevation {item.elevStart} → {item.elevEnd} m · Length {item.length} m
                      {item.boundaryNote && (
                        <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                          {item.boundaryNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedBridgeForModal && (
        <BridgeDetailModal
          bridge={selectedBridgeForModal}
          isOpen={Boolean(selectedBridgeForModal)}
          onClose={() => setSelectedBridgeForModal(null)}
        />
      )}

      {selectedStaffForModal && (
        <StaffIdModal
          staff={selectedStaffForModal}
          isOpen={Boolean(selectedStaffForModal)}
          onClose={() => setSelectedStaffForModal(null)}
        />
      )}

      {/* 🧭 Floating Mobile/Web Zoom & Navigation Control Widget (Bottom-Right) */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col items-center gap-1.5 p-2 bg-[#0f2b5c]/95 text-white rounded-2xl shadow-2xl border-2 border-cyan-400/50 backdrop-blur-md select-none animate-fadeIn">
        {/* Zoom Level Indicator */}
        <span className="text-[10px] font-mono font-black text-cyan-300 px-2 py-0.5 bg-black/40 rounded-lg">
          {pxPerKm} px/KM
        </span>

        <div className="flex items-center gap-1">
          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-90 text-white font-black text-base flex items-center justify-center shadow transition cursor-pointer"
            title="Vertical Zoom In (+)"
          >
            +
          </button>

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-90 text-white font-black text-base flex items-center justify-center shadow transition cursor-pointer"
            title="Vertical Zoom Out (−)"
          >
            −
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Scroll to Top (Corridor Start) */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (diagramContainerRef.current) diagramContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-cyan-300 text-sm flex items-center justify-center shadow transition cursor-pointer"
            title="Scroll to Top (Km 1167.210)"
          >
            ⬆
          </button>

          {/* Scroll to Bottom (Corridor End) */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              if (diagramContainerRef.current) diagramContainerRef.current.scrollTo({ top: diagramContainerRef.current.scrollHeight, behavior: 'smooth' });
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-cyan-300 text-sm flex items-center justify-center shadow transition cursor-pointer"
            title="Scroll to Bottom (Km 1249.720)"
          >
            ⬇
          </button>
        </div>

        {/* Reset Zoom */}
        <button
          type="button"
          onClick={() => setPxPerKm(248)}
          className="w-full px-2 py-1 rounded-lg bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-200 text-[10px] font-bold transition flex items-center justify-center gap-1 border border-cyan-400/30 active:scale-95 cursor-pointer"
          title="Reset Zoom to 248 px/KM"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
