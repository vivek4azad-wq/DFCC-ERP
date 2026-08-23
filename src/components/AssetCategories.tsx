/**
 * Category-Wise Asset Directory & Management
 * Dedicated categorized views for Track, Bridges, P&C, Curves, LC, LWR, SEJ, Defects, and Patrols.
 * Strict Constraint: GPS coordinates are rendered ONLY for Bridges.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/database.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Grid,
  ArrowLeft,
  Search,
  Filter,
  Train,
  MapPin,
  ExternalLink,
  Shield,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Phone,
  MessageSquare,
  Navigation,
  RefreshCw,
  Plus,
  Compass,
  X,
  GitFork,
  Route,
  Fence,
  ThermometerSun,
  Sliders,
  Footprints,
  Target,
  Landmark
} from 'lucide-react';
import { BridgeDetailModal } from './BridgeDetailModal.tsx';
import { StaffIdModal, type UnifiedStaffModalData } from './StaffIdModal.tsx';
import type {
  BridgeRecord,
  PointCrossingRecord,
  CurveRecord,
  LevelCrossingRecord,
  LWRRecord,
  SEJRecord,
  TrackDefectRecord,
  KeymanRecord,
  PatrolShiftRecord,
  BridgeWatchmanRecord
} from '../types/index.ts';

export type AssetCategoryKey =
  | 'points_crossings'
  | 'curves'
  | 'level_crossings'
  | 'lwr'
  | 'sej'
  | 'bridges'
  | 'track_defects'
  | 'defects'
  | 'keymen_patrol';

export interface CategoryCardConfig {
  key: AssetCategoryKey;
  title: string;
  subtitle: string;
  countLabel: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

export const CATEGORIES_CONFIG: CategoryCardConfig[] = [
  {
    key: 'bridges',
    title: 'Bridges',
    subtitle: '144 Total (1 Important, 25 Major, 118 Minor) with Verified GPS Locations',
    countLabel: '144 Bridges',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  {
    key: 'points_crossings',
    title: 'Points & Crossings',
    subtitle: '161 Turnouts & Derailing Switches with Switch Details & Sleepers',
    countLabel: '161 P&C',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  {
    key: 'curves',
    title: 'Curves',
    subtitle: '95 Horizontal Curves (51 UP, 44 DN) with Radius, Versine & Speed',
    countLabel: '95 Curves',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  {
    key: 'level_crossings',
    title: 'Level Crossings',
    subtitle: '5 Manned & Interlocked Gates with Census TVU & Gatemen Roster',
    countLabel: '5 Gates',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  {
    key: 'lwr',
    title: 'LWR / CWR',
    subtitle: '7 Long Welded Rail Sections with Gap Locations',
    countLabel: '7 Sections',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/30'
  },
  {
    key: 'sej',
    title: 'SEJ',
    subtitle: '13 Switch Expansion Joints with Standard Drawings & Temps',
    countLabel: '13 Joints',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/30'
  },
  {
    key: 'track_defects',
    title: 'Defects & Loops',
    subtitle: '48 Rail Defect / Siding & Loop Lines with Clear Standing Lengths',
    countLabel: '48 Defects / Loops',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    borderColor: 'border-red-500/30'
  },
  {
    key: 'keymen_patrol',
    title: 'Keymen & Patrol Beats',
    subtitle: '18 Keymen Beats, 24 Day/Night Patrols & 3 Bridge Watchmen',
    countLabel: '45 Beats',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30'
  }
];

export const CATEGORIES = CATEGORIES_CONFIG;

interface AssetCategoriesProps {
  initialCategory?: AssetCategoryKey | null;
  initialSectionFilter?: string;
  initialStationFilter?: string;
}

export const AssetCategories: React.FC<AssetCategoriesProps> = ({
  initialCategory = null,
  initialSectionFilter,
  initialStationFilter
}) => {
  const { role, currentUser } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [selectedCategory, setSelectedCategory] = useState<AssetCategoryKey | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption1, setFilterOption1] = useState('ALL');
  const [filterOption2, setFilterOption2] = useState('ALL');

  const [selectedBridgeForModal, setSelectedBridgeForModal] = useState<any | null>(null);
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<UnifiedStaffModalData | null>(null);

  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory);
    }
    if (initialSectionFilter) {
      setFilterOption2(initialSectionFilter);
    }
    if (initialStationFilter) {
      setFilterOption1(initialStationFilter);
    }
  }, [initialCategory, initialSectionFilter, initialStationFilter]);

  // Datasets
  const [bridges, setBridges] = useState<BridgeRecord[]>([]);
  const [pointsCrossings, setPointsCrossings] = useState<PointCrossingRecord[]>([]);
  const [curves, setCurves] = useState<CurveRecord[]>([]);
  const [levelCrossings, setLevelCrossings] = useState<LevelCrossingRecord[]>([]);
  const [lwrList, setLwrList] = useState<LWRRecord[]>([]);
  const [sejList, setSejList] = useState<SEJRecord[]>([]);
  const [defects, setDefects] = useState<TrackDefectRecord[]>([]);
  const [keymen, setKeymen] = useState<KeymanRecord[]>([]);
  const [patrolShifts, setPatrolShifts] = useState<PatrolShiftRecord[]>([]);
  const [bridgeWatchmen, setBridgeWatchmen] = useState<BridgeWatchmanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State (Admin Edit Functionality)
  const [editingItem, setEditingItem] = useState<{ category: AssetCategoryKey; data: any } | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [brg, pc, crv, lc, lwr, sej, def, km, pat, bwm] = await Promise.all([
        db.getCollection<BridgeRecord>('bridges'),
        db.getCollection<PointCrossingRecord>('points_crossings'),
        db.getCollection<CurveRecord>('curves'),
        db.getCollection<LevelCrossingRecord>('level_crossings'),
        db.getCollection<LWRRecord>('lwr'),
        db.getCollection<SEJRecord>('sej'),
        db.getCollection<TrackDefectRecord>('track_defects'),
        db.getCollection<KeymanRecord>('keymen'),
        db.getCollection<PatrolShiftRecord>('patrol_shifts'),
        db.getCollection<BridgeWatchmanRecord>('bridge_watchmen')
      ]);
      setBridges(brg);
      setPointsCrossings(pc);
      setCurves(crv);
      setLevelCrossings(lc);
      setLwrList(lwr);
      setSejList(sej);
      setDefects(def);
      setKeymen(km);
      setPatrolShifts(pat);
      setBridgeWatchmen(bwm);
    } catch (err) {
      console.error('Failed to load asset categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(() => {
      loadData();
    });
    return () => {
      unsub();
    };
  }, []);

  // Open Edit Modal for an Asset
  const handleOpenEdit = (category: AssetCategoryKey, item: any) => {
    setEditingItem({ category, data: item });
    setEditFormData({ ...item });
    setSaveSuccessMsg(null);
  };

  // Save updates to DB
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      let colName: any = editingItem.category;
      if (editingItem.category === 'defects') colName = 'track_defects';
      if (editingItem.category === 'keymen_patrol') {
        if (editingItem.data.id.startsWith('KM-')) colName = 'keymen';
        else if (editingItem.data.id.startsWith('PAT-')) colName = 'patrol_shifts';
        else colName = 'bridge_watchmen';
      }

      const cleanedData: Record<string, any> = { ...editFormData };
      if (cleanedData.latitude !== undefined) cleanedData.latitude = parseFloat(cleanedData.latitude) || 0;
      if (cleanedData.longitude !== undefined) cleanedData.longitude = parseFloat(cleanedData.longitude) || 0;
      if (cleanedData.km !== undefined && !isNaN(Number(cleanedData.km))) cleanedData.km = parseFloat(cleanedData.km);
      if (cleanedData.fromKm !== undefined && !isNaN(Number(cleanedData.fromKm))) cleanedData.fromKm = parseFloat(cleanedData.fromKm);
      if (cleanedData.toKm !== undefined && !isNaN(Number(cleanedData.toKm))) cleanedData.toKm = parseFloat(cleanedData.toKm);

      await db.updateDocument(colName, editingItem.data.id, cleanedData, currentUser);
      setSaveSuccessMsg('Asset details updated successfully!');
      await loadData();
      setTimeout(() => {
        setEditingItem(null);
        setSaveSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Filtered Datasets
  // -------------------------------------------------------------------------

  const filteredBridges = useMemo(() => {
    return bridges.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        b.bridgeNo.toLowerCase().includes(q) ||
        (b.oldBridgeNo || '').toLowerCase().includes(q) ||
        b.sectionCode.toLowerCase().includes(q) ||
        String(b.km).includes(q);
      const matchType = filterOption1 === 'ALL' || b.category === filterOption1 || (b.bridgeType || '').includes(filterOption1);
      const matchSec = filterOption2 === 'ALL' || b.sectionCode.includes(filterOption2);
      return matchQ && matchType && matchSec;
    });
  }, [bridges, searchQuery, filterOption1, filterOption2]);

  const filteredPC = useMemo(() => {
    return pointsCrossings.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        p.station.toLowerCase().includes(q) ||
        p.pointNo.toLowerCase().includes(q) ||
        String(p.srjChainage || p.km).includes(q);
      const matchStn = filterOption1 === 'ALL' || p.station === filterOption1;
      const matchAngle = filterOption2 === 'ALL' || (p.angle || p.turnoutRatio || '').includes(filterOption2);
      return matchQ && matchStn && matchAngle;
    });
  }, [pointsCrossings, searchQuery, filterOption1, filterOption2]);

  const filteredCurves = useMemo(() => {
    return curves.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        String(c.curveNo).includes(q) ||
        String(c.fromKm).includes(q) ||
        String(c.toKm).includes(q) ||
        (c.yard || '').toLowerCase().includes(q);
      const matchDeg =
        filterOption1 === 'ALL' ||
        (filterOption1 === 'SHARP' ? c.degree > 1.5 : c.degree <= 1.5);
      const matchInsp = filterOption2 === 'ALL' || (c.inspectionJurisdiction || '').includes(filterOption2);
      return matchQ && matchDeg && matchInsp;
    });
  }, [curves, searchQuery, filterOption1, filterOption2]);

  const filteredLC = useMemo(() => {
    return levelCrossings.filter(lc => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        lc.gateNo.toLowerCase().includes(q) ||
        String(lc.km).includes(q) ||
        (lc.fromStn || '').toLowerCase().includes(q) ||
        (lc.toStn || '').toLowerCase().includes(q)
      );
    });
  }, [levelCrossings, searchQuery]);

  const filteredLWR = useMemo(() => {
    return lwrList.filter(l => {
      const q = searchQuery.toLowerCase().trim();
      const lSection = l.section || l.sectionCode || '';
      return (
        !q ||
        l.lwrNo.toLowerCase().includes(q) ||
        lSection.toLowerCase().includes(q) ||
        String(l.fromKm).includes(q)
      );
    });
  }, [lwrList, searchQuery]);

  const filteredSEJ = useMemo(() => {
    return sejList.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const sSection = s.section || s.sectionCode || '';
      const sKm = s.chainage ?? s.locationKm ?? 0;
      return (
        !q ||
        s.sejNo.toLowerCase().includes(q) ||
        sSection.toLowerCase().includes(q) ||
        String(sKm).includes(q)
      );
    });
  }, [sejList, searchQuery]);

  const filteredDefects = useMemo(() => {
    return defects.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        d.defectCode.toLowerCase().includes(q) ||
        (d.chainage || '').toLowerCase().includes(q) ||
        (d.location || '').toLowerCase().includes(q) ||
        String(d.km).includes(q);
      const matchSev = filterOption1 === 'ALL' || d.severity === filterOption1;
      const matchStatus = filterOption2 === 'ALL' || d.status === filterOption2;
      return matchQ && matchSev && matchStatus;
    });
  }, [defects, searchQuery, filterOption1, filterOption2]);

  // -------------------------------------------------------------------------
  // Render Main Category Selection Grid (Clean Light Theme matching Screenshot)
  // -------------------------------------------------------------------------

  if (!selectedCategory) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Top Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Assets Categories</h2>
              <p className="text-xs text-slate-500">
                Categorized infrastructure telemetry across 88.679 Km (DFCCIL IMSD SMUN Unit)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl">
              8 Standard Asset Groups
            </span>
          </div>
        </div>

        {/* 2x4 Clean Card Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setSearchQuery('');
                  setFilterOption1('ALL');
                  setFilterOption2('ALL');
                }}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-400 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3.5 transition group shadow-sm hover:shadow-md hover:-translate-y-0.5 min-h-[160px]"
              >
                {/* Specialized Category Icon Box */}
                <div className={`w-14 h-14 rounded-2xl ${cat.iconBg} ${cat.iconColor} border ${cat.borderColor} flex items-center justify-center group-hover:scale-110 transition shadow-inner`}>
                  {cat.key === 'bridges' && (
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 17h20" />
                      <path d="M4 17V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9" />
                      <path d="M4 12h16" />
                      <path d="M8 17v-5" />
                      <path d="M12 17v-5" />
                      <path d="M16 17v-5" />
                    </svg>
                  )}
                  {cat.key === 'points_crossings' && <GitFork className="w-7 h-7 rotate-90" />}
                  {cat.key === 'curves' && <Route className="w-7 h-7" />}
                  {cat.key === 'level_crossings' && <Fence className="w-7 h-7" />}
                  {cat.key === 'lwr' && <ThermometerSun className="w-7 h-7" />}
                  {cat.key === 'sej' && <Sliders className="w-7 h-7" />}
                  {cat.key === 'track_defects' && <Target className="w-7 h-7" />}
                  {cat.key === 'keymen_patrol' && <Footprints className="w-7 h-7" />}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-cyan-300 transition leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    {cat.countLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Corridor Jurisdiction Banner */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Main Line:</strong> Km 1167.210 to Km 1249.720 (82.510 Km) | <strong>Link Line:</strong> Km 1171.981 to Km 1178.150 (6.169 Km)
            </span>
          </div>
          <div className="font-mono text-emerald-700 font-semibold shrink-0">
            Total Corridor: 88.679 Km
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render Category Detail View
  // -------------------------------------------------------------------------

  const currentCatMeta = CATEGORIES.find(c => c.key === selectedCategory)!;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Category Detail Header with Back Button */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition flex items-center justify-center shrink-0"
              title="Back to Categories Grid"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentCatMeta.title}</h2>
                <span className="text-xs font-mono px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold">
                  {currentCatMeta.countLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentCatMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search asset, Km, code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-600 focus:bg-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          1. BRIDGES TABLE (ONLY Category with GPS Coordinates!)
      ---------------------------------------------------------------------- */}
      {selectedCategory === 'bridges' && (
        <div className="space-y-4">
          {/* Bridges Filters */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-sm">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            {['ALL', 'FOB', 'ROB', 'RUB', 'MAJOR', 'MINOR'].map(t => (
              <button
                key={t}
                onClick={() => setFilterOption1(t)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterOption1 === t
                    ? 'bg-[#123b72] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {t}
              </button>
            ))}

            <span className="text-emerald-700 font-semibold ml-auto flex items-center gap-1 font-mono">
              📍 GPS Coordinates verified for all 144 Bridges
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Bridge No</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">From Km</th>
                    <th className="p-3">Old No</th>
                    <th className="p-3">Span Configuration</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">GPS Location</th>
                    <th className="p-3 text-right">Details / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {filteredBridges.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition font-sans">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900 font-mono">
                        <button
                          type="button"
                          onClick={() => setSelectedBridgeForModal(b)}
                          className="text-[#123b72] hover:underline font-bold font-mono text-left inline-flex items-center gap-1"
                          title="Click to view full bridge details popup"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-semibold transition"
                        >
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>Exact Pin ({b.latitude.toFixed(4)}, {b.longitude.toFixed(4)})</span>
                        </a>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedBridgeForModal(b)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#123b72] border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition active:scale-95 shadow-sm"
                          title="View Official Bridge Popup Details"
                        >
                          <span>🌉</span>
                          <span>Details</span>
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleOpenEdit('bridges', b)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs"
                            title="Edit Bridge"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          2. POINTS & CROSSINGS (NO GPS Coordinates)
      ---------------------------------------------------------------------- */}
      {selectedCategory === 'points_crossings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-sm">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Train className="w-3.5 h-3.5 text-[#123b72]" /> Station:
            </span>
            {['ALL', 'SMUN', 'SBJN', 'NSIR', 'GVGN', 'KNNN', 'CHAN', 'SNL'].map(s => (
              <button
                key={s}
                onClick={() => setFilterOption1(s)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterOption1 === s
                    ? 'bg-[#123b72] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Station</th>
                    <th className="p-3">Point No</th>
                    <th className="p-3">Line</th>
                    <th className="p-3">Angle</th>
                    <th className="p-3">SRJ Chainage</th>
                    <th className="p-3">Laid On</th>
                    <th className="p-3">Hand</th>
                    <th className="p-3">Traffic</th>
                    {isSuperAdmin && <th className="p-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {filteredPC.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition font-sans">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-pink-700">{p.station}</td>
                      <td className="p-3 font-bold text-slate-900 font-mono">{p.pointNo}</td>
                      <td className="p-3 text-slate-700">{p.line || p.trackType}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-50 border border-slate-200 text-slate-700">
                          {p.angle || p.turnoutRatio}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-emerald-700 font-mono">
                        Km {Number(p.srjChainage || p.km).toFixed(3)}
                      </td>
                      <td className="p-3 text-slate-700">{p.laidOn || p.operation}</td>
                      <td className="p-3 text-slate-700">{p.hand}</td>
                      <td className="p-3 text-slate-600">{p.traffic || '-'}</td>
                      {isSuperAdmin && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenEdit('points_crossings', p)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs"
                            title="Edit Point"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          3. CURVES (NO GPS Coordinates)
      ---------------------------------------------------------------------- */}
      {selectedCategory === 'curves' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-sm">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#123b72]" /> Degree:
            </span>
            {[
              { label: 'All Curves', val: 'ALL' },
              { label: 'Degree ≤ 1.5°', val: 'FLAT' },
              { label: 'Degree > 1.5° (Sharp)', val: 'SHARP' }
            ].map(d => (
              <button
                key={d.val}
                onClick={() => setFilterOption1(d.val)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterOption1 === d.val
                    ? 'bg-[#123b72] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Curve No</th>
                    <th className="p-3">From Km</th>
                    <th className="p-3">To Km</th>
                    <th className="p-3">Length (m)</th>
                    <th className="p-3">Degree</th>
                    <th className="p-3">Radius (m)</th>
                    <th className="p-3">Versine (mm)</th>
                    <th className="p-3">Cant SE (mm)</th>
                    <th className="p-3">Yard / Section</th>
                    {isSuperAdmin && <th className="p-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {filteredCurves.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition font-sans">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-blue-700 font-mono">#{c.curveNo}</td>
                      <td className="p-3 font-bold text-emerald-700 font-mono">Km {c.fromKm.toFixed(3)}</td>
                      <td className="p-3 text-slate-700 font-mono">{c.toKm.toFixed(3)}</td>
                      <td className="p-3 text-slate-800">{c.lengthMeters} m</td>
                      <td className="p-3 font-bold text-slate-900">{c.degree}°</td>
                      <td className="p-3 text-cyan-800">{c.radiusMeters} m</td>
                      <td className="p-3 text-slate-600">{c.versineMm || '-'}</td>
                      <td className="p-3 text-slate-600">{c.cantMm ? `${c.cantMm} mm` : '-'}</td>
                      <td className="p-3 text-slate-600">{c.yard || 'Main Line'}</td>
                      {isSuperAdmin && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenEdit('curves', c)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs"
                            title="Edit Curve"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          4. LEVEL CROSSINGS (NO GPS Coordinates)
      ---------------------------------------------------------------------- */}
      {selectedCategory === 'level_crossings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLC.map((lc) => (
            <div
              key={lc.id}
              className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      LC Gate {lc.gateNo}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      Class: {lc.classification}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Chainage: Km {lc.km.toFixed(3)} ({lc.fromStn} – {lc.toStn})
                  </h3>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleOpenEdit('level_crossings', lc)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs"
                    title="Edit Gate"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">TVU Census</span>
                  <span className="text-slate-900 font-bold font-mono">{lc.tuv?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Interlocking</span>
                  <span className="text-emerald-700 font-semibold">{lc.interlocked ? 'Interlocked' : 'Non-Interlocked'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Telephone Connected</span>
                  <span className="text-slate-800 font-semibold">{lc.telephoneLinkedStation}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Gatemen Roster</span>
                  <span className="text-slate-800 font-semibold">{lc.gatemen?.length || 3} Staff</span>
                </div>
              </div>

              {/* Gatemen List with Call & WhatsApp */}
              {lc.gatemen && lc.gatemen.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700">Assigned Gatemen:</h4>
                  {lc.gatemen.map((gm: any, gIdx: number) => {
                    const cleanPhone = (gm.mobile || '').replace(/[^0-9]/g, '');
                    return (
                      <div
                        key={gIdx}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-sm"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{gm.name}</div>
                          <div className="text-[11px] text-slate-500">
                            ID: {gm.id} | {gm.residence}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
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
                          <a
                            href={`tel:${gm.mobile}`}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WA</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {lc.rg && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  <strong>Rest Giver:</strong> {lc.rg}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------------------
          5. LWR / CWR (NO GPS Coordinates)
      ---------------------------------------------------------------------- */}
      {selectedCategory === 'lwr' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">LWR No</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">From Km</th>
                  <th className="p-3">To Km</th>
                  <th className="p-3">Length (Km)</th>
                  <th className="p-3">Gap Location</th>
                  {isSuperAdmin && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {filteredLWR.map((l, idx) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition font-sans">
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-amber-800 font-mono">LWR #{l.lwrNo}</td>
                    <td className="p-3 font-bold text-slate-900">{l.section}</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Km {l.fromKm.toFixed(3)}</td>
                    <td className="p-3 text-slate-700 font-mono">{l.toKm.toFixed(3)}</td>
                    <td className="p-3 text-cyan-800 font-bold">{l.lengthKm} Km</td>
                    <td className="p-3 text-slate-700">{l.gapOn}</td>
                    {isSuperAdmin && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenEdit('lwr', l)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs"
                          title="Edit LWR"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          6. SEJ (NO GPS Coordinates)
      ---------------------------------------------------------------------- */}
      {selectedCategory === 'sej' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">SEJ No</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Chainage (Km)</th>
                  <th className="p-3">Standard Drawing</th>
                  <th className="p-3">Temperature</th>
                  {isSuperAdmin && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {filteredSEJ.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition font-sans">
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-bold text-pink-700 font-mono">SEJ #{s.sejNo}</td>
                    <td className="p-3 font-bold text-slate-900">{s.section || s.sectionCode || ''}</td>
                    <td className="p-3 font-bold text-emerald-700 font-mono">Km {(s.chainage ?? s.locationKm ?? 0).toFixed(3)}</td>
                    <td className="p-3 text-slate-700">{s.drawingNo}</td>
                    <td className="p-3 text-amber-800 font-semibold">{s.temperature}</td>
                    {isSuperAdmin && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenEdit('sej', s)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs"
                          title="Edit SEJ"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          7. DEFECTS (NO GPS Coordinates)
      ---------------------------------------------------------------------- */}
      {selectedCategory === 'defects' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-sm">
            <span className="text-slate-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Severity:
            </span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilterOption1(sev)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterOption1 === sev
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Chainage</th>
                    <th className="p-3">Rail Side</th>
                    <th className="p-3">Line</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action Taken</th>
                    {isSuperAdmin && <th className="p-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {filteredDefects.map((d, idx) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition font-sans">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-emerald-700 font-mono">{d.chainage}</td>
                      <td className="p-3 font-bold text-cyan-800">{d.rail === 'RIGHT_RAIL' ? '(RR)' : '(LR)'}</td>
                      <td className="p-3 text-slate-700">{d.trackLine}</td>
                      <td className="p-3 text-slate-700">{d.location || d.sectionCode}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.severity === 'CRITICAL'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : d.severity === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {d.severity}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'ATTENDED' || d.status === 'VERIFIED_CLOSED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-[11px] truncate max-w-[200px]">{d.actionTaken || '-'}</td>
                      {isSuperAdmin && (
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenEdit('defects', d)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs"
                            title="Edit Defect"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          8. KEYMEN & PATROL BEATS (NO GPS Coordinates)
      ---------------------------------------------------------------------- */}
      {selectedCategory === 'keymen_patrol' && (
        <div className="space-y-6">
          {/* Keymen Roster */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                👷 Assigned Keymen Beats ({keymen.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keymen.map(km => {
                const cleanPhone = (km.mobileNo || '').replace(/[^0-9]/g, '');
                return (
                  <div
                    key={km.id}
                    className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-cyan-800">{km.beatNoText}</span>
                        <h4 className="text-sm font-bold text-slate-900">{km.name}</h4>
                        {km.fatherName && <p className="text-[11px] text-slate-500">S/o {km.fatherName}</p>}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-mono rounded font-bold">
                        AWPO: {km.awpoId || km.staffId}
                      </span>
                    </div>

                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Coverage:</span>
                        <span className="text-emerald-700 font-mono font-bold">{km.kmRange || `Km ${km.fromKm.toFixed(3)} → ${km.toKm.toFixed(3)}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Residence:</span>
                        <span className="text-slate-700">{km.residence}, {km.district}</span>
                      </div>
                    </div>

                    {km.rg && (
                      <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg">
                        <strong>Rest Giver:</strong> {km.rg}
                      </div>
                    )}

                    {/* Call, WhatsApp & ID Card Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700">{km.mobileNo}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffForModal(km)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                          title="View DFCCIL Staff ID"
                        >
                          <span>🪪</span>
                          <span>ID</span>
                        </button>
                        <a
                          href={`tel:${km.mobileNo}`}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WA</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bridge Watchmen Roster */}
          {bridgeWatchmen.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  🌉 Bridge Watchmen ({bridgeWatchmen.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bridgeWatchmen.map(w => {
                  const cleanPhone = (w.mobile || '').replace(/[^0-9]/g, '');
                  return (
                    <div key={w.id} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{w.name}</h4>
                          <p className="text-xs text-amber-700">{w.post}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">ID: {w.staffId}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">S/o {w.father} | {w.residence}, {w.district}</p>
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                        <span className="text-xs font-mono font-bold text-slate-700">{w.mobile}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStaffForModal({
                              name: w.name,
                              awpoId: w.staffId,
                              post: w.post || 'Bridge Watchman',
                              fatherName: w.father,
                              residence: w.residence,
                              district: w.district,
                              phone: w.mobile,
                              category: 'Ex-Serviceman'
                            })}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200 font-semibold"
                          >
                            🪪 ID
                          </button>
                          <a href={`tel:${w.mobile}`} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-200">Call</a>
                          <a href={`https://wa.me/91${cleanPhone.slice(-10)}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-200">WA</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Patrol Shifts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                🚶 Patrol Shifts Roster ({patrolShifts.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patrolShifts.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 text-xs shadow-sm">
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-900 font-bold">{p.beatCode}: {p.patrolmanName || 'Vacant'}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.shiftType === 'DAY' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                      {p.shiftType === 'DAY' ? 'Day Patrol (15:00-23:00)' : 'Night Patrol (23:00-07:00)'}
                    </span>
                  </div>
                  <div className="text-slate-500">Route: <span className="text-slate-800 font-medium">{p.route || `Km ${p.fromKm.toFixed(3)} → ${p.toKm.toFixed(3)}`}</span></div>
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
                            post: p.shiftType === 'DAY' ? 'Day Security Patrol' : 'Night Security Patrol',
                            beatCode: p.beatCode,
                            fromKm: p.fromKm,
                            toKm: p.toKm,
                            category: 'Ex-Serviceman'
                          })}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-200 font-semibold"
                        >
                          🪪 ID
                        </button>
                      )}
                      {p.patrolmanPhone && (
                        <a href={`tel:${p.patrolmanPhone}`} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-200">Call</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          ADMIN EDIT MODAL (Requirement 2)
      ---------------------------------------------------------------------- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">
                  Edit Asset Record ({editingItem.data.id})
                </span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Special GPS Tag Linking for Bridges */}
              {editingItem.category === 'bridges' && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span>Bridge GPS Location Tagging</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          alert('Geolocation is not supported by this device.');
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          pos => {
                            setEditFormData(prev => ({
                              ...prev,
                              latitude: parseFloat(pos.coords.latitude.toFixed(6)),
                              longitude: parseFloat(pos.coords.longitude.toFixed(6))
                            }));
                            alert(`GPS Coordinates Captured: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                          },
                          err => {
                            alert(`GPS Error: ${err.message}. Please enable location permissions.`);
                          },
                          { enableHighAccuracy: true, timeout: 15000 }
                        );
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>📍 Capture Live GPS</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-200/80">
                    You can manually edit the coordinates below or click 'Capture Live GPS' while at the bridge site.
                  </p>
                </div>
              )}

              {Object.entries(editFormData).map(([key, val]) => {
                if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return null;
                return (
                  <div key={key}>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={val !== undefined && val !== null ? String(val) : ''}
                      onChange={e => setEditFormData({ ...editFormData, [key]: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                );
              })}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bridge Detail Popup Modal (Image 2) */}
      <BridgeDetailModal
        bridge={selectedBridgeForModal}
        isOpen={Boolean(selectedBridgeForModal)}
        onClose={() => setSelectedBridgeForModal(null)}
      />

      {/* DFCCIL Staff ID Modal (Image 1) */}
      <StaffIdModal
        staff={selectedStaffForModal}
        isOpen={Boolean(selectedStaffForModal)}
        onClose={() => setSelectedStaffForModal(null)}
      />
    </div>
  );
};
