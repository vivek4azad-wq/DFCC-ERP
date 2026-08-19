/**
 * KM Quick Finder - Overhauled to match authentic DFCCIL Portal reference
 * Comprehensive single-KM & range search displaying Keymen, Patrolmen, Level Crossings, Bridges, P&C, Curves & Defects.
 * Strict Constraint: GPS coordinates & Map Pin are displayed ONLY for Bridges.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/database.ts';
import { launchNavigation } from '../services/geo.ts';
import {
  Search,
  Train,
  MapPin,
  ExternalLink,
  Shield,
  Navigation,
  RefreshCw,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Layers,
  ArrowRight,
  Sparkles,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { BridgeDetailModal } from './BridgeDetailModal.tsx';
import { StaffIdModal, type UnifiedStaffModalData } from './StaffIdModal.tsx';
import { GRADIENT_RECORDS } from '../data/gradientData.ts';
import type {
  BridgeRecord,
  PointCrossingRecord,
  CurveRecord,
  LevelCrossingRecord,
  KeymanRecord,
  PatrolShiftRecord,
  TrackDefectRecord,
  LWRRecord,
  SEJRecord
} from '../types/index.ts';

const QUICK_STATIONS = [
  { code: 'KRJN', name: 'New Kalanour', km: 1167.210 },
  { code: 'SMUN', name: 'New Shambhu', km: 1170.435 },
  { code: 'SBJN', name: 'New Sarai Banjara', km: 1188.575 },
  { code: 'NSIR', name: 'New Sirhind', km: 1202.015 },
  { code: 'GVGN', name: 'New Mandi Gobindgarh', km: 1213.187 },
  { code: 'KNNN', name: 'New Khanna', km: 1229.087 },
  { code: 'CHAN', name: 'New Chawa Pail', km: 1235.837 },
  { code: 'SNL', name: 'New Sanahwal', km: 1249.720 },
  { code: 'RPJ', name: 'SMUN-RPJ Link Line', km: 1171.981 }
];

interface KmQuickFinderProps {
  prefillFromKm?: string | null;
  prefillToKm?: string | null;
  clearPrefill?: () => void;
}

export const KmQuickFinder: React.FC<KmQuickFinderProps> = ({
  prefillFromKm,
  prefillToKm,
  clearPrefill
}) => {
  const [kmInput, setKmInput] = useState('1170.500');
  const [isSearching, setIsSearching] = useState(false);

  // Raw collections
  const [allBridges, setAllBridges] = useState<BridgeRecord[]>([]);
  const [allPC, setAllPC] = useState<PointCrossingRecord[]>([]);
  const [allCurves, setAllCurves] = useState<CurveRecord[]>([]);
  const [allLC, setAllLC] = useState<LevelCrossingRecord[]>([]);
  const [allLWR, setAllLWR] = useState<LWRRecord[]>([]);
  const [allSEJ, setAllSEJ] = useState<SEJRecord[]>([]);
  const [allKeymen, setAllKeymen] = useState<KeymanRecord[]>([]);
  const [allPatrol, setAllPatrol] = useState<PatrolShiftRecord[]>([]);
  const [allDefects, setAllDefects] = useState<TrackDefectRecord[]>([]);

  // Search Results State
  const [activeKm, setActiveKm] = useState<number>(1170.500);
  const [matchedKeymen, setMatchedKeymen] = useState<KeymanRecord[]>([]);
  const [matchedDayPatrol, setMatchedDayPatrol] = useState<PatrolShiftRecord[]>([]);
  const [matchedNightPatrol, setMatchedNightPatrol] = useState<PatrolShiftRecord[]>([]);
  const [matchedLC, setMatchedLC] = useState<LevelCrossingRecord[]>([]);
  const [matchedBridges, setMatchedBridges] = useState<BridgeRecord[]>([]);
  const [matchedPC, setMatchedPC] = useState<PointCrossingRecord[]>([]);
  const [matchedCurves, setMatchedCurves] = useState<CurveRecord[]>([]);
  const [matchedLWR, setMatchedLWR] = useState<LWRRecord[]>([]);
  const [matchedSEJ, setMatchedSEJ] = useState<SEJRecord[]>([]);
  const [matchedDefects, setMatchedDefects] = useState<TrackDefectRecord[]>([]);

  const [selectedBridgeForModal, setSelectedBridgeForModal] = useState<any | null>(null);
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<UnifiedStaffModalData | null>(null);

  const loadAll = async () => {
    try {
      const [brg, pc, crv, lc, lwr, sej, km, pat, def] = await Promise.all([
        db.getCollection<BridgeRecord>('bridges'),
        db.getCollection<PointCrossingRecord>('points_crossings'),
        db.getCollection<CurveRecord>('curves'),
        db.getCollection<LevelCrossingRecord>('level_crossings'),
        db.getCollection<LWRRecord>('lwr'),
        db.getCollection<SEJRecord>('sej'),
        db.getCollection<KeymanRecord>('keymen'),
        db.getCollection<PatrolShiftRecord>('patrol_shifts'),
        db.getCollection<TrackDefectRecord>('track_defects')
      ]);
      setAllBridges(brg);
      setAllPC(pc);
      setAllCurves(crv);
      setAllLC(lc);
      setAllLWR(lwr);
      setAllSEJ(sej);
      setAllKeymen(km);
      setAllPatrol(pat);
      setAllDefects(def);

      executeSearch(activeKm || 1170.500, brg, pc, crv, lc, km, pat, def, lwr, sej);
    } catch (err) {
      console.error('Failed to load collections for KM finder:', err);
    }
  };

  useEffect(() => {
    loadAll();
    const unsub = db.subscribe(() => {
      loadAll();
    });
    return () => {
      unsub();
    };
  }, []);

  // Handle prefill prop triggers
  useEffect(() => {
    if (prefillFromKm) {
      const parsed = parseFloat(prefillFromKm);
      if (!isNaN(parsed)) {
        setKmInput(parsed.toFixed(3));
        executeSearch(parsed);
      }
      if (clearPrefill) clearPrefill();
    }
  }, [prefillFromKm]);

  // Core Search Algorithm matching DFCCIL Portal reference
  const executeSearch = (
    kmVal: number,
    brgList = allBridges,
    pcList = allPC,
    crvList = allCurves,
    lcList = allLC,
    kmList = allKeymen,
    patList = allPatrol,
    defList = allDefects,
    lwrList = allLWR,
    sejList = allSEJ
  ) => {
    if (isNaN(kmVal)) return;
    setIsSearching(true);
    setActiveKm(kmVal);

    // 1. Keymen match (covering this KM)
    const nearKeymen = kmList.filter(k => {
      const minKm = Math.min(k.fromKm, k.toKm);
      const maxKm = Math.max(k.fromKm, k.toKm);
      return kmVal >= minKm - 0.05 && kmVal <= maxKm + 0.05;
    });

    // 2. Patrol Shifts (covering this KM)
    const dayPatrol = patList.filter(
      p => p.shiftType === 'DAY' && kmVal >= p.fromKm - 0.1 && kmVal <= p.toKm + 0.1
    );
    const nightPatrol = patList.filter(
      p => p.shiftType === 'NIGHT' && kmVal >= p.fromKm - 0.1 && kmVal <= p.toKm + 0.1
    );

    // 3. Level Crossings within +-2.5 Km
    const nearLC = lcList.filter(lc => {
      const lcKm = lc.km ?? (typeof lc.chainage === 'number' ? lc.chainage : parseFloat(String(lc.chainage || 0)));
      return Math.abs(lcKm - kmVal) <= 2.5;
    });

    // 4. Bridges within +-1.0 Km (ONLY Category with GPS Coordinates!)
    const nearBridges = brgList.filter(b => {
      const bFrom = b.fromKm !== undefined ? b.fromKm : (b.from_km !== undefined ? b.from_km : (b.km ?? 0));
      const bTo = b.toKm !== undefined ? b.toKm : (b.to_km !== undefined ? b.to_km : (b.km ?? 0));
      return (bFrom >= kmVal - 1.0 && bFrom <= kmVal + 1.0) || (bTo >= kmVal - 1.0 && bTo <= kmVal + 1.0);
    });

    // 5. Points & Crossings within +-1.0 Km (NO GPS Coordinates)
    const nearPC = pcList.filter(p => {
      const pKm = p.srjChainage !== undefined ? p.srjChainage : (p.srj_chainage !== undefined ? p.srj_chainage : (p.km ?? 0));
      return Math.abs(pKm - kmVal) <= 1.0;
    });

    // 6. Curves within +-1.0 Km (NO GPS Coordinates)
    const nearCurves = crvList.filter(c => {
      const cFrom = c.fromKm ?? c.from_km ?? 0;
      const cTo = c.toKm ?? c.to_km ?? 0;
      return (cFrom >= kmVal - 1.0 && cFrom <= kmVal + 1.0) || (cTo >= kmVal - 1.0 && cTo <= kmVal + 1.0);
    });

    // 7. Defects within +-1.0 Km (NO GPS Coordinates)
    const nearDefects = defList.filter(d => {
      const dKm = d.km ?? (typeof d.chainageKm === 'number' ? d.chainageKm : parseFloat(String(d.chainageKm || 0)));
      return Math.abs(dKm - kmVal) <= 1.0;
    });

    // 8. LWR within +-2.0 Km
    const nearLWR = lwrList.filter(l => {
      const lFrom = Number(l.fromKm !== undefined ? l.fromKm : l.from);
      const lTo = Number(l.toKm !== undefined ? l.toKm : l.to);
      return (kmVal >= lFrom - 0.2 && kmVal <= lTo + 0.2);
    });

    // 9. SEJ within +-1.0 Km
    const nearSEJ = sejList.filter(s => {
      const sKm = Number(s.chainage || s.srj_chainage || 0);
      return Math.abs(sKm - kmVal) <= 1.0;
    });

    setMatchedKeymen(nearKeymen);
    setMatchedDayPatrol(dayPatrol);
    setMatchedNightPatrol(nightPatrol);
    setMatchedLC(nearLC);
    setMatchedBridges(nearBridges);
    setMatchedPC(nearPC);
    setMatchedCurves(nearCurves);
    setMatchedDefects(nearDefects);
    setMatchedLWR(nearLWR);
    setMatchedSEJ(nearSEJ);

    setIsSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStr = kmInput.replace(/\+/g, '.');
    const parsed = parseFloat(cleanStr);
    if (!isNaN(parsed)) {
      executeSearch(parsed);
    }
  };

  const handleQuickJump = (km: number) => {
    setKmInput(km.toFixed(3));
    executeSearch(km);
  };

  const [linearWindowSize, setLinearWindowSize] = useState<number>(1.0);

  const nearbyLinearAssets = useMemo(() => {
    const minW = activeKm - linearWindowSize;
    const maxW = activeKm + linearWindowSize;
    const list: any[] = [];

    allBridges.forEach(b => {
      const km = Number(b.fromKm !== undefined ? b.fromKm : b.km);
      if (km >= minW - 0.05 && km <= maxW + 0.05) {
        const bType = (b.type || 'Minor').toUpperCase();
        const typeClass = bType.includes('MJB') || bType.includes('MAJOR') ? 'bridge mjb'
          : bType.includes('RUB') ? 'bridge rub'
          : bType.includes('ROB') ? 'bridge rob'
          : bType.includes('FOB') ? 'bridge fob'
          : bType.includes('OWG') ? 'bridge owg'
          : 'bridge mib';

        list.push({
          id: `brg-${b.id}`,
          type: 'Bridge',
          km,
          label: `Bridge ${b.bridgeNo}`,
          subLabel: `${b.type || 'Minor'} · Old Br: ${b.oldBridgeNo || '-'}`,
          badge: `🌉 Br ${b.bridgeNo}`,
          color: '#2563eb',
          cssClass: typeClass,
          latitude: b.latitude,
          longitude: b.longitude,
          raw: b
        });
      }
    });

    allPC.forEach(p => {
      const km = Number(p.srjChainage || p.km || 0);
      if (km >= minW - 0.05 && km <= maxW + 0.05) {
        list.push({
          id: `pc-${p.id}`,
          type: 'PC',
          km,
          label: `Point ${p.pointNo || p.point_no}`,
          subLabel: `${p.station || p.station_code || 'SMUN'} · ${p.crossingAngle || '1 in 12'}`,
          badge: `🛤️ Pt ${p.pointNo || p.point_no}`,
          color: '#16a34a',
          cssClass: 'pc',
          raw: p
        });
      }
    });

    allCurves.forEach(c => {
      const km = Number(c.fromKm !== undefined ? c.fromKm : c.km);
      if (km >= minW - 0.05 && km <= maxW + 0.05) {
        list.push({
          id: `crv-${c.id}`,
          type: 'Curve',
          km,
          label: `Curve ${c.curveNo || c.curve_no}`,
          subLabel: `${Number(c.fromKm || 0).toFixed(3)}-${Number(c.toKm || 0).toFixed(3)} · ${c.degree || '-'}°`,
          badge: `🔄 C#${c.curveNo || c.curve_no}`,
          color: '#f59e0b',
          cssClass: 'curve',
          raw: c
        });
      }
    });

    allLC.forEach(lc => {
      const km = Number(lc.km !== undefined ? lc.km : (lc.chainage || 0));
      if (km >= minW - 0.05 && km <= maxW + 0.05) {
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
      }
    });

    allLWR.forEach(l => {
      const km = Number(l.fromKm !== undefined ? l.fromKm : l.from);
      if (km >= minW - 0.05 && km <= maxW + 0.05) {
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
      }
    });

    allSEJ.forEach(s => {
      const km = Number(s.chainage || s.srj_chainage || 0);
      if (km >= minW - 0.05 && km <= maxW + 0.05) {
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
      }
    });

    return list.sort((a, b) => a.km - b.km);
  }, [allBridges, allPC, allCurves, allLC, allLWR, allSEJ, activeKm, linearWindowSize]);

  const handleLinearAssetClick = (asset: any) => {
    if (asset.type === 'Bridge') {
      setSelectedBridgeForModal(asset.raw);
    } else if (asset.type === 'LC') {
      const gList = asset.raw.gatemen || [];
      const primary = gList[0];
      setSelectedStaffForModal({
        name: primary?.name || `Gateman (LC ${asset.raw.gateNo || asset.raw.lc_no})`,
        awpoId: primary?.id || '46536',
        mobileNo: primary?.mobile || '9478553153',
        fatherName: primary?.fatherName || '-',
        beatNoText: `Gate ${asset.raw.gateNo || asset.raw.lc_no}`,
        beatCode: `LC-${asset.raw.gateNo || asset.raw.lc_no}`,
        fromKm: asset.raw.km || asset.raw.chainage,
        toKm: asset.raw.km || asset.raw.chainage,
        sectionCode: asset.raw.sectionCode || asset.raw.section,
        post: 'Gate Keeper / Gateman',
        category: 'Ex-Serviceman'
      });
    } else if (asset.latitude && asset.longitude) {
      launchNavigation(asset.latitude, asset.longitude, asset.label);
    }
  };

  const nearestStation = QUICK_STATIONS.reduce((prev, curr) => {
    return Math.abs(curr.km - activeKm) < Math.abs(prev.km - activeKm) ? curr : prev;
  }, QUICK_STATIONS[0]);
  const stationDist = Math.abs(activeKm - nearestStation.km).toFixed(3);

  const currentGradient = useMemo(() => {
    return GRADIENT_RECORDS.find(g => {
      const s = parseFloat(g.startKm) / 1000;
      const e = parseFloat(g.endKm) / 1000;
      return activeKm >= s - 0.001 && activeKm <= e + 0.001;
    }) || null;
  }, [activeKm]);

  const sectionName =
    activeKm <= 1170.435
      ? 'UBCD-SMUN (New Kalanour to New Shambhu)'
      : activeKm <= 1188.575
      ? 'SMUN-SBJN (New Shambhu to New Sarai Banjara)'
      : activeKm <= 1202.015
      ? 'SBJN-NSIR (New Sarai Banjara to New Sirhind)'
      : 'NSIR-SNL (New Sirhind to New Chawapail / Sanahwal)';

  const minKm = activeKm - linearWindowSize;
  const maxKm = activeKm + linearWindowSize;
  const totalSpan = maxKm - minKm;
  const pxPerKm = 360;
  const canvasHeight = Math.max(480, Math.round(totalSpan * pxPerKm + 100));
  const getY = (km: number) => 50 + (km - minKm) * pxPerKm;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 print-container">
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">KM Quick Finder &amp; Asset Lookup</h2>
            <p className="text-xs text-slate-500">
              Immediate corridor inventory, Keymen, Patrolmen, Gates, Bridges &amp; Turnouts across 88.679 Km
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={kmInput}
              onChange={e => setKmInput(e.target.value)}
              placeholder="Enter DFCCIL Km (e.g. 1170.435, 1188.575)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition shadow-inner placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-[#123b72] hover:bg-[#1a4f9c] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md active:scale-95 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{isSearching ? 'Searching...' : 'Search Location'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-bold mr-1">Quick Jump:</span>
          {QUICK_STATIONS.map(stn => (
            <button
              key={stn.code}
              type="button"
              onClick={() => handleQuickJump(stn.km)}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg font-mono text-[11px] transition active:scale-95"
            >
              <strong>{stn.code}</strong> ({stn.km.toFixed(3)})
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 font-mono">
              Km {activeKm.toFixed(3)}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-mono">
              Nearest: <strong>{nearestStation.name} ({nearestStation.code})</strong> · {stationDist} Km away
            </span>

            {currentGradient && (
              <span className={`px-3 py-1 rounded-xl font-mono font-bold flex items-center gap-1 border ${
                currentGradient.direction === 'RISE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : currentGradient.direction === 'FALL'
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-blue-50 text-blue-800 border-blue-300'
              }`}>
                {currentGradient.direction === 'RISE' ? <TrendingUp className="w-3.5 h-3.5" /> : currentGradient.direction === 'FALL' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                <span>Gradient: {currentGradient.gradient === '0' ? 'LEVEL' : `1 in ${Math.abs(Number(currentGradient.gradient))}`} ({currentGradient.direction})</span>
                <span className="text-[10px] opacity-75">· Elev {currentGradient.elevStart}m → {currentGradient.elevEnd}m</span>
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-700 flex items-center gap-2">
          <Train className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><strong>Section:</strong> {sectionName}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            👷 Assigned Keyman Beat ({matchedKeymen.length})
          </span>
        </div>

        {matchedKeymen.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedKeymen.map(km => {
              const cleanPhone = (km.mobileNo || '').replace(/[^0-9]/g, '');
              return (
                <div
                  key={km.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-blue-700">{km.beatNoText}</span>
                      <h4 className="text-base font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffForModal(km)}
                          className="hover:text-blue-700 hover:underline text-left font-bold"
                          title="Click to view DFCCIL Staff ID"
                        >
                          {km.name}
                        </button>
                      </h4>
                      {km.fatherName && <p className="text-xs text-slate-500">S/o {km.fatherName}</p>}
                    </div>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs font-mono rounded font-bold shadow-sm">
                      AWPO: {km.awpoId || km.staffId}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Km Coverage:</span>
                      <span className="text-emerald-700 font-mono font-bold">{km.kmRange || `Km ${km.fromKm.toFixed(3)} → ${km.toKm.toFixed(3)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Residence:</span>
                      <span className="text-slate-700">{km.residence}, {km.district}</span>
                    </div>
                  </div>

                  {km.rg && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                      <strong>Rest Giver:</strong> {km.rg}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">{km.mobileNo}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStaffForModal(km)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                        title="View Official DFCCIL Staff ID Card"
                      >
                        <span>🪪</span>
                        <span>ID</span>
                      </button>
                      <a
                        href={`tel:${km.mobileNo}`}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WA</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            No specific keyman beat range matched directly for Km {activeKm.toFixed(3)}.
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            🚶 Assigned Patrolman Beats (Diurnal Roster)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
              <Clock className="w-4 h-4" />
              <span>☀️ Shift 1: Day Patrol (15:00 to 23:00)</span>
            </div>

            {matchedDayPatrol.length > 0 ? (
              matchedDayPatrol.map(p => (
                <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs shadow-sm">
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-900 font-bold">{p.beatCode}: {p.patrolmanName || 'Vacant Beat'}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isFilled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-slate-500">Route: <span className="text-slate-800 font-medium">{p.route || `Km ${p.fromKm.toFixed(3)} – ${p.toKm.toFixed(3)}`}</span></div>
                  <div className="text-slate-500">Rest Day: <span className="text-slate-800 font-medium">{p.restDay || '-'}</span></div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-mono text-slate-700 font-bold">{p.patrolmanPhone || '-'}</span>
                    <div className="flex items-center gap-1.5">
                      {p.patrolmanName && !p.patrolmanName.includes('Vacant') && (
                        <button
                          type="button"
                          onClick={() => setSelectedStaffForModal({
                            name: p.patrolmanName || '',
                            awpoId: p.patrolmanStaffId || '',
                            mobileNo: p.patrolmanPhone || '',
                            post: 'Day Security Patrolman',
                            beatCode: p.beatCode,
                            fromKm: p.fromKm,
                            toKm: p.toKm,
                            category: 'Ex-Serviceman'
                          })}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200"
                        >
                          🪪 ID
                        </button>
                      )}
                      {p.patrolmanPhone && (
                        <a href={`tel:${p.patrolmanPhone}`} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold text-xs flex items-center gap-1 border border-emerald-200">
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No day patrol beat directly mapped at this Km.</p>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
              <Clock className="w-4 h-4" />
              <span>🌙 Shift 2: Night Patrol (23:00 to 07:00)</span>
            </div>

            {matchedNightPatrol.length > 0 ? (
              matchedNightPatrol.map(p => (
                <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs shadow-sm">
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-900 font-bold">{p.beatCode} (Pair)</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.isFilled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-slate-500">Names: <span className="text-slate-800 font-bold">{p.patrolmanName || 'Vacant Beat'}</span></div>
                  <div className="text-slate-500">Route: <span className="text-slate-800 font-medium">{p.route || `Km ${p.fromKm.toFixed(3)} – ${p.toKm.toFixed(3)}`}</span></div>
                  <div className="text-slate-500">Rest Day: <span className="text-slate-800 font-medium">{p.restDay || '-'}</span></div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-mono text-slate-700 font-bold">{p.patrolmanPhone || '-'}</span>
                    <div className="flex items-center gap-1.5">
                      {p.patrolmanName && !p.patrolmanName.includes('Vacant') && (
                        <button
                          type="button"
                          onClick={() => setSelectedStaffForModal({
                            name: p.patrolmanName || '',
                            awpoId: p.patrolmanStaffId || '',
                            mobileNo: p.patrolmanPhone || '',
                            post: 'Night Security Patrolman',
                            beatCode: p.beatCode,
                            fromKm: p.fromKm,
                            toKm: p.toKm,
                            category: 'Ex-Serviceman'
                          })}
                          className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200"
                        >
                          🪪 ID
                        </button>
                      )}
                      {p.patrolmanPhone && (
                        <a href={`tel:${p.patrolmanPhone}`} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold text-xs flex items-center gap-1 border border-emerald-200">
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No night patrol beat directly mapped at this Km.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>📐</span>
                <span>Vertical Linear Track Diagram — Km {activeKm.toFixed(3)}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Main schematic alignment showing tracks, chainage markers &amp; nearby branching assets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 px-1 font-bold">Span:</span>
            {[0.5, 1.0, 2.0].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setLinearWindowSize(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  linearWindowSize === s
                    ? 'bg-[#123b72] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                &plusmn;{s.toFixed(1)} Km
              </button>
            ))}
          </div>
        </div>

        <div className="v14-wrap" style={{ maxHeight: '600px' }}>
          <div className="v14-canvas" style={{ height: `${canvasHeight}px` }}>
            <div className="v14-track-a" style={{ left: '440px' }} />
            <div className="v14-track-b" style={{ left: '452px' }} />

            {(() => {
              const lines = [];
              const step = linearWindowSize <= 0.5 ? 0.25 : linearWindowSize <= 1.0 ? 0.5 : 1.0;
              const startK = Math.floor(minKm / step) * step;
              for (let k = startK; k <= maxKm + 0.001; k += step) {
                if (k >= minKm && k <= maxKm) {
                  const topY = getY(k);
                  lines.push(
                    <React.Fragment key={`grid-${k}`}>
                      <div className="v14-kmline" style={{ top: `${topY}px` }} />
                      <div className="v14-kmtext" style={{ top: `${topY}px`, left: '12px' }}>
                        KM {k.toFixed(3)}
                      </div>
                    </React.Fragment>
                  );
                }
              }
              return lines;
            })()}

            <div
              style={{
                top: `${getY(activeKm)}px`,
                left: 0,
                right: 0,
                position: 'absolute',
                height: '2px',
                background: '#dc2626',
                zIndex: 8,
                boxShadow: '0 0 8px rgba(220, 38, 38, 0.6)'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '420px',
                  top: '-12px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>📍 Target Km {activeKm.toFixed(3)}</span>
              </div>
            </div>

            {(() => {
              const lastY: Record<string, number> = { L0: -999, L1: -999, R0: -999, R1: -999 };
              let flip = 0;

              return nearbyLinearAssets.map(asset => {
                const yy = getY(asset.km);
                const isLeft = flip++ % 2 === 0;
                const keys = isLeft ? ['L0', 'L1'] : ['R0', 'R1'];
                const key = keys.find(k => yy - (lastY[k] || -999) > 46) || keys[0];
                lastY[key] = yy;

                const topAsset = Math.max(2, yy - 18);
                const sideClass = isLeft ? 'left' : 'right';
                const leftPos = isLeft
                  ? key.endsWith('1') ? '540px' : '490px'
                  : key.endsWith('1') ? '760px' : '710px';

                return (
                  <React.Fragment key={asset.id}>
                    <div
                      className={`v14-asset ${sideClass} ${asset.cssClass}`}
                      style={{
                        top: `${topAsset}px`,
                        left: leftPos
                      }}
                      onClick={() => handleLinearAssetClick(asset)}
                      title={`${asset.label}\n${asset.subLabel}\nKm ${asset.km.toFixed(3)} (Click for details)`}
                    >
                      <strong>{asset.label}</strong>
                      <span className="text-[10px] text-slate-600 block leading-tight truncate">{asset.subLabel}</span>
                    </div>

                    <div
                      className="v14-connector"
                      style={{
                        top: `${yy}px`,
                        left: isLeft ? '440px' : '452px',
                        width: isLeft ? (key.endsWith('1') ? '100px' : '50px') : (key.endsWith('1') ? '308px' : '258px')
                      }}
                    />
                  </React.Fragment>
                );
              });
            })()}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Bridges ({matchedBridges.length})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> P&amp;C ({matchedPC.length})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Curves ({matchedCurves.length})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> LC Gates ({matchedLC.length})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> LWR ({matchedLWR.length})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> SEJ ({matchedSEJ.length})</span>
          </div>
          <span className="font-mono text-[#123b72] font-bold">
            Total {nearbyLinearAssets.length} Assets in Window (&plusmn;{linearWindowSize.toFixed(1)} Km)
          </span>
        </div>
      </div>

      {matchedLC.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🚥 Level Crossings within &plusmn;2.5 Km ({matchedLC.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedLC.map(lc => (
              <div key={lc.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-emerald-700">Gate No. {lc.gateNo || lc.lc_no}</span>
                    <h4 className="text-sm font-bold text-slate-900 font-mono">
                      Chainage: Km {(lc.km ?? (typeof lc.chainage === 'number' ? lc.chainage : parseFloat(String(lc.chainage || 0)))).toFixed(3)} ({lc.fromStn || lc.from_stn || ''} – {lc.toStn || lc.to_stn || ''})
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs font-mono rounded font-bold shadow-sm">
                    TVU: {lc.tuv?.toLocaleString()}
                  </span>
                </div>

                {lc.gatemen && lc.gatemen.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600">Gatemen Roster:</span>
                    {lc.gatemen.map((gm, gIdx) => {
                      const cleanGmPhone = (gm.mobile || '').replace(/[^0-9]/g, '');
                      return (
                        <div key={gIdx} className="bg-white p-2 rounded-lg flex items-center justify-between text-xs border border-slate-200 shadow-sm">
                          <div>
                            <div className="text-slate-900 font-semibold">{gm.name}</div>
                            <div className="text-[10px] text-slate-500">ID: {gm.id} | {gm.residence}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedStaffForModal({
                                name: gm.name,
                                awpoId: gm.id,
                                mobileNo: gm.mobile,
                                post: 'Gateman',
                                residence: gm.residence,
                                category: 'Outsource'
                              })}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200 font-semibold"
                            >
                              🪪 ID
                            </button>
                            <a href={`tel:${gm.mobile}`} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-200 font-medium">Call</a>
                            <a href={`https://wa.me/91${cleanGmPhone.slice(-10)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-200 font-medium">WA</a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            🌉 Bridges within &plusmn;1.0 Km ({matchedBridges.length})
          </span>
          <span className="text-xs text-slate-500 font-mono font-bold">
            GPS Pin Verified
          </span>
        </div>

        {matchedBridges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Bridge No</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">From Km</th>
                  <th className="p-3">Old No</th>
                  <th className="p-3">Span</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Exact Map Pin</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {matchedBridges.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition font-sans">
                    <td className="p-3 font-bold text-slate-900 font-mono">
                      <button
                        type="button"
                        onClick={() => setSelectedBridgeForModal(b)}
                        className="text-[#123b72] hover:underline text-left font-bold font-mono inline-flex items-center gap-1"
                        title="Click to view full bridge popup details"
                      >
                        <span>🌉</span>
                        <span>{b.bridgeNo}</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {b.bridgeType || b.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">
                      Km {Number(b.fromKm || b.km).toFixed(3)}
                    </td>
                    <td className="p-3 text-cyan-800 font-mono">{b.oldBridgeNo || '-'}</td>
                    <td className="p-3 text-slate-700">{b.spanConfiguration}</td>
                    <td className="p-3 text-slate-600">{b.sectionCode}</td>
                    <td className="p-3">
                      <a
                        href={`https://www.google.com/maps?q=${b.latitude},${b.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition"
                      >
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>Exact Pin</span>
                      </a>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBridgeForModal(b)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#123b72] border border-blue-200 rounded-lg text-xs font-semibold transition active:scale-95 shadow-sm"
                        title="View Official Bridge Popup"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No bridges situated within &plusmn;1.0 Km.</p>
        )}
      </div>

      {matchedPC.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
            🛤️ Points &amp; Crossings within &plusmn;1.0 Km ({matchedPC.length})
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Station</th>
                  <th className="p-3">Point No</th>
                  <th className="p-3">Line</th>
                  <th className="p-3">Angle</th>
                  <th className="p-3">SRJ Chainage</th>
                  <th className="p-3">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {matchedPC.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition font-sans">
                    <td className="p-3 font-bold text-pink-700">{p.station}</td>
                    <td className="p-3 font-bold text-slate-900 font-mono">{p.pointNo}</td>
                    <td className="p-3 text-slate-700">{p.line || p.trackType}</td>
                    <td className="p-3 text-slate-600 font-mono">{p.angle || p.turnoutRatio}</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">
                      Km {Number(p.srjChainage || p.km).toFixed(3)}
                    </td>
                    <td className="p-3 text-slate-700">{p.laidOn || p.operation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {matchedCurves.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            🔄 Curves within &plusmn;1.0 Km ({matchedCurves.length})
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Curve No</th>
                  <th className="p-3">From Km</th>
                  <th className="p-3">To Km</th>
                  <th className="p-3">Degree</th>
                  <th className="p-3">Radius (m)</th>
                  <th className="p-3">Length (m)</th>
                  <th className="p-3">Cant SE (mm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {matchedCurves.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition font-sans">
                    <td className="p-3 font-bold text-blue-700 font-mono">#{c.curveNo || c.curve_no}</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Km {(c.fromKm ?? c.from_km ?? 0).toFixed(3)}</td>
                    <td className="p-3 text-slate-700 font-mono">{(c.toKm ?? c.to_km ?? 0).toFixed(3)}</td>
                    <td className="p-3 font-bold text-slate-900">{c.degree}°</td>
                    <td className="p-3 text-cyan-800">{c.radiusMeters || c.radius} m</td>
                    <td className="p-3 text-slate-800">{c.lengthMeters || c.length_m} m</td>
                    <td className="p-3 text-slate-600">{c.cantMm || c.se ? `${c.cantMm || c.se} mm` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {matchedDefects.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            📍 Track Defects / Welds within &plusmn;1.0 Km ({matchedDefects.length})
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Chainage</th>
                  <th className="p-3">Rail Side</th>
                  <th className="p-3">Line</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {matchedDefects.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition font-sans">
                    <td className="p-3 font-bold text-emerald-700 font-mono">{d.chainage}</td>
                    <td className="p-3 font-bold text-cyan-800">{d.rail === 'RIGHT_RAIL' ? '(RR)' : '(LR)'}</td>
                    <td className="p-3 text-slate-700">{d.trackLine}</td>
                    <td className="p-3 text-slate-600">{d.location || d.sectionCode}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{d.status}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{d.actionTaken || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BridgeDetailModal
        bridge={selectedBridgeForModal}
        isOpen={Boolean(selectedBridgeForModal)}
        onClose={() => setSelectedBridgeForModal(null)}
      />

      <StaffIdModal
        staff={selectedStaffForModal}
        isOpen={Boolean(selectedStaffForModal)}
        onClose={() => setSelectedStaffForModal(null)}
      />
    </div>
  );
};
