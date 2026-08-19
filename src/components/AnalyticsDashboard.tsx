/**
 * Interactive Graphical Analytics & Jurisdiction Dashboard
 * Powered by Chart.js / react-chartjs-2 & Real-time Database queries
 * DFCCIL IMSD SMUN Unit
 * 
 * Features:
 * - Fully Dynamic & Clickable KPI Cards & Table Rows (Section & Station filtered navigation)
 * - Proposed & Verified Station Coordinates with Direct Google Maps Intent
 * - Preserved User's Brown/Amber Jurisdiction Dashboard Card
 * - Real-time Master DB subscription for instant Auto-Refresh
 */

import React, { useState, useEffect } from 'react';
import { db } from '../services/database.ts';
import { launchNavigation } from '../services/geo.ts';
import type { AnalyticsSummary } from '../types/index.ts';
import type { AssetCategoryKey } from './AssetCategories.tsx';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';
import {
  BarChart3,
  TrendingUp,
  Shield,
  Train,
  Users,
  Activity,
  Database,
  MapPin,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle,
  Navigation,
  FileText,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsDashboardProps {
  onQuickJump?: (fromKm: string, toKm: string) => void;
  onNavigateToAsset?: (category: AssetCategoryKey, sectionFilter?: string, stationFilter?: string) => void;
  onNavigateToStaff?: (tab: 'officers' | 'outsourced' | 'keymen' | 'patrol' | 'watchmen') => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onQuickJump,
  onNavigateToAsset,
  onNavigateToStaff,
  onNavigateToTab
}) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [jurisdictionLine, setJurisdictionLine] = useState<'main' | 'loop' | 'crossover'>('main');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await db.getAnalyticsSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const unsub = db.subscribe(() => {
      fetchAnalytics();
    });
    return () => {
      unsub();
    };
  }, []);

  if (loading || !summary) {
    return (
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3 bg-slate-900/40 rounded-2xl border border-slate-800">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
        <span>Aggregating real-time telemetry across 10 collections...</span>
      </div>
    );
  }

  // --- STATIONS DATA WITH CENTER CHAINAGES & COORDINATES ---
  const STATIONS = [
    { code: 'KRJN', name: 'New Kalanour (Start of Jurisdiction)', km: 1167.210, lat: 30.0830391, lon: 77.3392062 },
    { code: 'UBCD', name: 'New Ambala City', km: 1158.856, lat: 30.36480047, lon: 76.78420970 },
    { code: 'SMUN', name: 'New Shambhu Jn. (IMSD HQ)', km: 1170.435, lat: 30.43845483, lon: 76.66757351 },
    { code: 'SBJN', name: 'New Sarai Banjara', km: 1188.575, lat: 30.53744193, lon: 76.51726774 },
    { code: 'NSIR', name: 'New Sirhind Jn.', km: 1202.015, lat: 30.61047362, lon: 76.40613096 },
    { code: 'GVGN', name: 'New Mandi Gobindgarh', km: 1213.187, lat: 30.65781158, lon: 76.31939408 },
    { code: 'KNNN', name: 'New Khanna', km: 1229.087, lat: 30.73240010, lon: 76.17824291 },
    { code: 'CHAN', name: 'New Chawa Pail Jn.', km: 1235.837, lat: 30.77249243, lon: 76.10268950 },
    { code: 'SNL',  name: 'New Sanahwal / Doraha', km: 1249.720, lat: 30.82992131, lon: 75.99446589 },
    { code: 'RPJ',  name: 'Rajpura Detour (Link Line)', km: 1178.150, lat: 30.47997302, lon: 76.60357716 }
  ];

  // 1. Asset Breakdown Chart Data
  const assetChartData = {
    labels: ['Bridges (144)', 'Curves (95)', 'Points & Crossings (161)', 'Level Crossings (5)'],
    datasets: [
      {
        label: 'Total Asset Count',
        data: [
          summary.assetCountsByCategory.bridges,
          summary.assetCountsByCategory.curves,
          summary.assetCountsByCategory.pointsCrossings,
          summary.assetCountsByCategory.levelCrossings
        ],
        backgroundColor: ['#3b82f6', '#f59e0b', '#a855f7', '#10b981'],
        borderColor: ['#2563eb', '#d97706', '#9333ea', '#059669'],
        borderWidth: 1,
        borderRadius: 8
      }
    ]
  };

  // 2. Staff by Designation Chart Data
  const staffLabels = Object.keys(summary.staffByDesignation);
  const staffCounts = Object.values(summary.staffByDesignation);

  const staffChartData = {
    labels: staffLabels,
    datasets: [
      {
        data: staffCounts,
        backgroundColor: [
          '#8b5cf6',
          '#3b82f6',
          '#06b6d4',
          '#10b981',
          '#f59e0b',
          '#ec4899',
          '#64748b'
        ],
        borderWidth: 2,
        borderColor: '#0f172a'
      }
    ]
  };

  // 3. Defect Density Histogram
  const defectChartData = {
    labels: summary.defectsByKmBlock.labels,
    datasets: [
      {
        label: 'Logged Track Defects',
        data: summary.defectsByKmBlock.counts,
        backgroundColor: '#ef444499',
        borderColor: '#ef4444',
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };

  // 4. Patrol Shift Coverage
  const patrolChartData = {
    labels: [
      `Filled Shifts (${summary.patrolShiftStatus.filled})`,
      `Vacant Shifts (${summary.patrolShiftStatus.vacant})`
    ],
    datasets: [
      {
        data: [summary.patrolShiftStatus.filled, summary.patrolShiftStatus.vacant],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#0f172a'
      }
    ]
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter' },
          boxWidth: 12,
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  };

  const donutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter' },
          boxWidth: 12,
          padding: 10
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    cutout: '65%'
  };

  const handleQuickJumpClick = (km: number) => {
    if (onQuickJump) {
      const fromKm = (km - 0.05).toFixed(3);
      const toKm = (km + 0.05).toFixed(3);
      onQuickJump(fromKm, toKm);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">IMSD-SMUN Unit Command Dashboard</h2>
            <p className="text-xs text-slate-400">
              Central Telemetry across 88.679 Km Corridor • Real-time Data Linked
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* JURISDICTION SECTION (Preserved User's Brown/Amber Card) */}
      <div className="bg-slate-900/80 border border-amber-600/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-[#7c4a1e] to-[#9a632e] text-white px-5 py-3.5 font-bold text-base tracking-wide flex items-center gap-2 border-b border-amber-700/50">
          <Layers className="w-5 h-5 text-amber-200" />
          <span>User's Jurisdiction (IMSD-SMUN)</span>
        </div>

        {/* Radio Toggles Bar */}
        <div className="bg-[#fdf6ec]/10 border-b border-[#ebd7be]/20 px-5 py-3 flex flex-wrap items-center gap-6 text-sm font-semibold text-[#fbe3b5]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="jurisdiction_line"
              value="main"
              checked={jurisdictionLine === 'main'}
              onChange={() => setJurisdictionLine('main')}
              className="accent-[#9a632e] w-4 h-4 cursor-pointer"
            />
            <span>Main Line</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="jurisdiction_line"
              value="loop"
              checked={jurisdictionLine === 'loop'}
              onChange={() => setJurisdictionLine('loop')}
              className="accent-[#9a632e] w-4 h-4 cursor-pointer"
            />
            <span>Loop Line</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="jurisdiction_line"
              value="crossover"
              checked={jurisdictionLine === 'crossover'}
              onChange={() => setJurisdictionLine('crossover')}
              className="accent-[#9a632e] w-4 h-4 cursor-pointer"
            />
            <span>Cross Over / Emergency Crossover</span>
          </label>

          <span className="md:ml-auto text-xs text-[#ebd7be]/80 font-mono">
            Main: <strong>82.510 Km</strong> | Link: <strong>6.169 Km</strong> | Total: <strong>88.679 Km</strong>
          </span>
        </div>

        {/* Dynamic Jurisdiction Content */}
        <div className="p-5">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-500/10 text-amber-300 font-semibold border-b border-slate-800">
                  <th className="p-3">Route</th>
                  <th className="p-3">TMS Section</th>
                  <th className="p-3">Line</th>
                  <th className="p-3 text-center">From Km</th>
                  <th className="p-3 text-center">From Meter</th>
                  <th className="p-3 text-center">To Km</th>
                  <th className="p-3 text-center">To Meter</th>
                  <th className="p-3 text-right">Section Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {jurisdictionLine === 'main' && (
                  <>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">KRJN-SMUN (Main Line)</td>
                      <td className="p-3 text-slate-400">New Kalanour - New Shambhu</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">SL / UP / DN</span></td>
                      <td className="p-3 text-center font-bold font-mono">1167</td>
                      <td className="p-3 text-center font-mono text-slate-400">210</td>
                      <td className="p-3 text-center font-bold font-mono">1170</td>
                      <td className="p-3 text-center font-mono text-slate-400">435</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">3.225 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">SMUN-SBJN (Main Line)</td>
                      <td className="p-3 text-slate-400">New Shambhu - New Sarai Banjara</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">SL / UP / DN</span></td>
                      <td className="p-3 text-center font-bold font-mono">1170</td>
                      <td className="p-3 text-center font-mono text-slate-400">435</td>
                      <td className="p-3 text-center font-bold font-mono">1188</td>
                      <td className="p-3 text-center font-mono text-slate-400">575</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">18.140 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">SBJN-NSIR (Main Line)</td>
                      <td className="p-3 text-slate-400">New Sarai Banjara - New Sirhind</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">SL / UP / DN</span></td>
                      <td className="p-3 text-center font-bold font-mono">1188</td>
                      <td className="p-3 text-center font-mono text-slate-400">575</td>
                      <td className="p-3 text-center font-bold font-mono">1202</td>
                      <td className="p-3 text-center font-mono text-slate-400">015</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">13.440 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">NSIR-GVGN (Main Line)</td>
                      <td className="p-3 text-slate-400">New Sirhind - New Gobindgarh</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">SL / UP / DN</span></td>
                      <td className="p-3 text-center font-bold font-mono">1202</td>
                      <td className="p-3 text-center font-mono text-slate-400">015</td>
                      <td className="p-3 text-center font-bold font-mono">1213</td>
                      <td className="p-3 text-center font-mono text-slate-400">187</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">11.172 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">GVGN-KNNN (Main Line)</td>
                      <td className="p-3 text-slate-400">New Gobindgarh - New Khanna</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">SL / UP / DN</span></td>
                      <td className="p-3 text-center font-bold font-mono">1213</td>
                      <td className="p-3 text-center font-mono text-slate-400">187</td>
                      <td className="p-3 text-center font-bold font-mono">1229</td>
                      <td className="p-3 text-center font-mono text-slate-400">087</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">15.900 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">KNNN-CHAN (Main Line)</td>
                      <td className="p-3 text-slate-400">New Khanna - New Chawa Pail</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">SL / UP / DN</span></td>
                      <td className="p-3 text-center font-bold font-mono">1229</td>
                      <td className="p-3 text-center font-mono text-slate-400">087</td>
                      <td className="p-3 text-center font-bold font-mono">1235</td>
                      <td className="p-3 text-center font-mono text-slate-400">837</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">6.750 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">CHAN-SNL (Main Line)</td>
                      <td className="p-3 text-slate-400">New Chawa Pail - New Sanahwal</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">SL / UP / DN</span></td>
                      <td className="p-3 text-center font-bold font-mono">1235</td>
                      <td className="p-3 text-center font-mono text-slate-400">837</td>
                      <td className="p-3 text-center font-bold font-mono">1249</td>
                      <td className="p-3 text-center font-mono text-slate-400">720</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">13.883 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40 bg-amber-500/5 border-t border-b border-amber-600/30">
                      <td className="p-3 font-bold text-amber-300">SMUN-RPJ (Link Line)</td>
                      <td className="p-3 text-slate-300">New Shambhu - Rajpura Detour</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-bold">LINK</span></td>
                      <td className="p-3 text-center font-bold font-mono text-amber-300">1171</td>
                      <td className="p-3 text-center font-mono text-amber-200/70">981</td>
                      <td className="p-3 text-center font-bold font-mono text-amber-300">1178</td>
                      <td className="p-3 text-center font-mono text-amber-200/70">150</td>
                      <td className="p-3 text-right font-mono text-amber-300 font-bold">6.169 Km</td>
                    </tr>
                  </>
                )}
                {jurisdictionLine === 'loop' && (
                  <>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>SMUN Yard Loops</strong></td>
                      <td className="p-3 text-slate-400">Up Loop, Dn Loop, Goods Loops</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">LL</span></td>
                      <td className="p-3 text-center font-bold font-mono">1168</td>
                      <td className="p-3 text-center font-mono text-slate-400">697</td>
                      <td className="p-3 text-center font-bold font-mono">1172</td>
                      <td className="p-3 text-center font-mono text-slate-400">297</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">3.600 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>SBJN Yard Loops</strong></td>
                      <td className="p-3 text-slate-400">Station Loop Lines</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">LL</span></td>
                      <td className="p-3 text-center font-bold font-mono">1186</td>
                      <td className="p-3 text-center font-mono text-slate-400">837</td>
                      <td className="p-3 text-center font-bold font-mono">1190</td>
                      <td className="p-3 text-center font-mono text-slate-400">292</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">3.455 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>NSIR Yard Loops</strong></td>
                      <td className="p-3 text-slate-400">Station Loop Lines</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">LL</span></td>
                      <td className="p-3 text-center font-bold font-mono">1200</td>
                      <td className="p-3 text-center font-mono text-slate-400">287</td>
                      <td className="p-3 text-center font-bold font-mono">1204</td>
                      <td className="p-3 text-center font-mono text-slate-400">293</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">4.006 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>GVGN Yard Loops</strong></td>
                      <td className="p-3 text-slate-400">Up Loop, Dn Loop, Goods Loops</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">LL</span></td>
                      <td className="p-3 text-center font-bold font-mono">1211</td>
                      <td className="p-3 text-center font-mono text-slate-400">290</td>
                      <td className="p-3 text-center font-bold font-mono">1215</td>
                      <td className="p-3 text-center font-mono text-slate-400">54</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">3.764 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>KNNN Yard Loops</strong></td>
                      <td className="p-3 text-slate-400">Station Loop Lines</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">LL</span></td>
                      <td className="p-3 text-center font-bold font-mono">1227</td>
                      <td className="p-3 text-center font-mono text-slate-400">267</td>
                      <td className="p-3 text-center font-bold font-mono">1230</td>
                      <td className="p-3 text-center font-mono text-slate-400">845</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">3.578 Km</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>CHAN Yard Loops</strong></td>
                      <td className="p-3 text-slate-400">Station Loop &amp; Siding Lines</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold">LL</span></td>
                      <td className="p-3 text-center font-bold font-mono">1235</td>
                      <td className="p-3 text-center font-mono text-slate-400">837</td>
                      <td className="p-3 text-center font-bold font-mono">1239</td>
                      <td className="p-3 text-center font-mono text-slate-400">419</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">3.582 Km</td>
                    </tr>
                  </>
                )}
                {jurisdictionLine === 'crossover' && (
                  <>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>SMUN Crossover Points</strong></td>
                      <td className="p-3 text-slate-400">Crossovers 201 A/B, 205 A/B, 243 A/B, 245 A/B, 248 A/B, 249 A/B</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-bold">XO</span></td>
                      <td className="p-3 text-center font-bold font-mono">1169</td>
                      <td className="p-3 text-center font-mono text-slate-400">045</td>
                      <td className="p-3 text-center font-bold font-mono">1171</td>
                      <td className="p-3 text-center font-mono text-slate-400">860</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">12 Sets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>SBJN Crossover Points</strong></td>
                      <td className="p-3 text-slate-400">Crossovers 201 A/B, 243 A/B, 290 A/B, 291 A/B, 295 A/B</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-bold">XO</span></td>
                      <td className="p-3 text-center font-bold font-mono">1187</td>
                      <td className="p-3 text-center font-mono text-slate-400">353</td>
                      <td className="p-3 text-center font-bold font-mono">1189</td>
                      <td className="p-3 text-center font-mono text-slate-400">915</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">10 Sets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>NSIR Crossover Points</strong></td>
                      <td className="p-3 text-slate-400">Crossovers 201 A/B, 243 A/B, 244 A/B, 245 A/B, 295 A/B, 296 A/B, 297 A/B</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-bold">XO</span></td>
                      <td className="p-3 text-center font-bold font-mono">1200</td>
                      <td className="p-3 text-center font-mono text-slate-400">778</td>
                      <td className="p-3 text-center font-bold font-mono">1203</td>
                      <td className="p-3 text-center font-mono text-slate-400">970</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">14 Sets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>GVGN Crossover Points</strong></td>
                      <td className="p-3 text-slate-400">Crossovers 201 A/B, 205 A/B, 246 A/B, 250 A/B, 254 A/B, 296 A/B</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-bold">XO</span></td>
                      <td className="p-3 text-center font-bold font-mono">1211</td>
                      <td className="p-3 text-center font-mono text-slate-400">705</td>
                      <td className="p-3 text-center font-bold font-mono">1214</td>
                      <td className="p-3 text-center font-mono text-slate-400">838</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">12 Sets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>KNNN Crossover Points</strong></td>
                      <td className="p-3 text-slate-400">Crossovers 201 A/B, 245 A/B, 247 A/B, 298 A/B</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-bold">XO</span></td>
                      <td className="p-3 text-center font-bold font-mono">1227</td>
                      <td className="p-3 text-center font-mono text-slate-400">772</td>
                      <td className="p-3 text-center font-bold font-mono">1230</td>
                      <td className="p-3 text-center font-mono text-slate-400">528</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">8 Sets</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3"><strong>CHAN Crossover Points</strong></td>
                      <td className="p-3 text-slate-400">Crossovers 201 A/B, 206 A/B, 245 A/B, 248 A/B, 297 A/B, 298 A/B</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-bold">XO</span></td>
                      <td className="p-3 text-center font-bold font-mono">1236</td>
                      <td className="p-3 text-center font-mono text-slate-400">153</td>
                      <td className="p-3 text-center font-bold font-mono">1238</td>
                      <td className="p-3 text-center font-mono text-slate-400">791</td>
                      <td className="p-3 text-right font-mono text-emerald-400 font-bold">12 Sets</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          FULLY DYNAMIC & CLICKABLE KPI CARDS GRID (Requirement 2)
      ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Section Range Card */}
        <div
          onClick={() => onNavigateToTab?.('kmfinder')}
          className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 p-4 rounded-2xl shadow-md border-l-4 border-l-blue-500 cursor-pointer transition hover:scale-[1.02] active:scale-95 group"
          title="Click to search Km in Quick Finder"
        >
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>Section Range</span>
            <ChevronRight className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            1167.210 <span className="text-xs font-normal text-slate-400">to 1249.72</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Main: 82.51 + Link: 6.17 Km</div>
        </div>

        {/* 2. Total Bridges Card */}
        <div
          onClick={() => onNavigateToAsset?.('bridges')}
          className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl shadow-md border-l-4 border-l-emerald-500 cursor-pointer transition hover:scale-[1.02] active:scale-95 group"
          title="Click to view 144 Bridges"
        >
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>Total Bridges</span>
            <ChevronRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="text-xl font-black text-white font-mono">{summary.assetCountsByCategory.bridges}</div>
          <div className="text-[10px] text-slate-500 mt-1">18 MJB, 74 MIB, 37 RUB, 9 ROB, 6 FOB</div>
        </div>

        {/* 3. Points & Crossings Card */}
        <div
          onClick={() => onNavigateToAsset?.('points_crossings')}
          className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl shadow-md border-l-4 border-l-amber-500 cursor-pointer transition hover:scale-[1.02] active:scale-95 group"
          title="Click to view 161 Points & Crossings"
        >
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>Points &amp; Crossings</span>
            <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="text-xl font-black text-white font-mono">{summary.assetCountsByCategory.pointsCrossings}</div>
          <div className="text-[10px] text-slate-500 mt-1">41 Main, 120 Loop/DS (118 1:12, 4 1:8.5)</div>
        </div>

        {/* 4. Total Curves Card */}
        <div
          onClick={() => onNavigateToAsset?.('curves')}
          className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-2xl shadow-md border-l-4 border-l-cyan-500 cursor-pointer transition hover:scale-[1.02] active:scale-95 group"
          title="Click to view 95 Curves"
        >
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>Total Curves</span>
            <ChevronRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="text-xl font-black text-white font-mono">{summary.assetCountsByCategory.curves}</div>
          <div className="text-[10px] text-slate-500 mt-1">84 (&lt;1.5°), 11 (&gt;1.5°)</div>
        </div>

        {/* 5. Level Crossings & SEJ Card */}
        <div
          onClick={() => onNavigateToAsset?.('level_crossings')}
          className="bg-slate-900/80 border border-slate-800 hover:border-red-500/50 p-4 rounded-2xl shadow-md border-l-4 border-l-red-500 cursor-pointer transition hover:scale-[1.02] active:scale-95 group"
          title="Click to view 5 Level Crossings & 13 SEJs"
        >
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>Level Crossings</span>
            <ChevronRight className="w-3 h-3 text-red-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {summary.assetCountsByCategory.levelCrossings} LC <span className="text-xs font-normal text-slate-400">/ 13 SEJ</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">7 LWR Sections (~96.7 Km)</div>
        </div>

        {/* 6. Keymen / Staff Shifts Card */}
        <div
          onClick={() => onNavigateToStaff?.('keymen')}
          className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl shadow-md border-l-4 border-l-purple-500 cursor-pointer transition hover:scale-[1.02] active:scale-95 group"
          title="Click to view Keymen & Staff"
        >
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
            <span>Keymen / Shifts</span>
            <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            {summary.keymenCount} <span className="text-xs font-normal text-slate-400">/ {summary.patrolShiftStatus.total}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">14 Officers &amp; Staff in unit</div>
        </div>
      </div>

      {/* 🚨 Vacant Beat / Patrol Alert Section */}
      {summary.patrolShiftStatus.vacant > 0 && (
        <div
          onClick={() => onNavigateToStaff?.('patrol')}
          className="bg-gradient-to-r from-red-950/60 to-amber-950/40 border border-red-500/40 rounded-2xl p-5 shadow-xl space-y-4 animate-pulse-slow cursor-pointer hover:border-red-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 bg-red-600/30 text-red-400 border border-red-500/40 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-300 tracking-tight">⚠️ Vacant Beat / Patrol Alert</h3>
              <p className="text-xs text-red-200/70">
                {summary.patrolShiftStatus.vacant} vacant patrol shift(s) detected. Click here to view &amp; assign.
              </p>
            </div>
            <span className="ml-auto px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-black">
              {summary.patrolShiftStatus.vacant} VACANT
            </span>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-red-500/20 pt-3">
            Check Staff → Patrol Shifts tab for detailed vacant shift information and quick assignment.
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          SECTION-WISE TABLES (Clickable & Filterable - Requirement 2)
      ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stations Table with Direct Maps Pin */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Train className="w-4 h-4 text-blue-400" />
              <span>🚉 Stations in IMSD-SMUN Jurisdiction</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Proposed Coordinates</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Station Name</th>
                  <th className="p-2.5 text-center">Center Km</th>
                  <th className="p-2.5 text-center">GPS Navigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {STATIONS.map((station) => (
                  <tr key={station.code} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md font-bold font-mono">
                        {station.code}
                      </span>
                    </td>
                    <td
                      onClick={() => launchNavigation(station.lat, station.lon, station.name)}
                      className="p-2.5 font-semibold text-slate-100 hover:text-cyan-300 cursor-pointer"
                      title="Click to Navigate to Station"
                    >
                      {station.name}
                    </td>
                    <td className="p-2.5 text-center font-mono text-amber-400 font-bold">{station.km.toFixed(3)}</td>
                    <td className="p-2.5 text-center flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickJumpClick(station.km)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-md text-[10px] font-bold transition"
                      >
                        🔍 Find
                      </button>
                      <button
                        type="button"
                        onClick={() => launchNavigation(station.lat, station.lon, station.name)}
                        className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold transition inline-flex items-center gap-1"
                      >
                        <Navigation className="w-2.5 h-2.5" />
                        <span>Navigate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bridge Breakdown by Section (Clickable Section Filter - Requirement 2) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>🌉 Bridge Breakdown by Section (Total: {summary.assetCountsByCategory.bridges})</span>
            </h3>
            <span className="text-[10px] text-slate-400">Click row to filter Bridges</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">Section</th>
                  <th className="p-2.5 text-center">MJB</th>
                  <th className="p-2.5 text-center">MIB</th>
                  <th className="p-2.5 text-center">RUB</th>
                  <th className="p-2.5 text-center">ROB</th>
                  <th className="p-2.5 text-center">FOB</th>
                  <th className="p-2.5 text-center">OWG</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {[
                  { sec: 'UBCD-SMUN', mjb: 1, mib: 2, rub: 1, rob: 1, fob: 0, owg: 0, tot: 5 },
                  { sec: 'SMUN-SBJN', mjb: 5, mib: 19, rub: 8, rob: 2, fob: 1, owg: 1, tot: 36 },
                  { sec: 'SBJN-NSIR', mjb: 6, mib: 16, rub: 8, rob: 0, fob: 1, owg: 0, tot: 31 },
                  { sec: 'NSIR-GVGN', mjb: 4, mib: 11, rub: 9, rob: 2, fob: 0, owg: 2, tot: 28 },
                  { sec: 'GVGN-KNNN', mjb: 0, mib: 10, rub: 3, rob: 3, fob: 2, owg: 0, tot: 19 },
                  { sec: 'KNNN-CHAN', mjb: 0, mib: 6, rub: 3, rob: 1, fob: 0, owg: 0, tot: 11 },
                  { sec: 'CHAN-SNL', mjb: 1, mib: 8, rub: 3, rob: 0, fob: 2, owg: 1, tot: 18 },
                  { sec: 'SMUN-RPJ', mjb: 1, mib: 2, rub: 2, rob: 0, fob: 0, owg: 1, tot: 6, isLink: true }
                ].map((row) => (
                  <tr
                    key={row.sec}
                    onClick={() => onNavigateToAsset?.('bridges', row.sec)}
                    className={`cursor-pointer transition hover:bg-blue-600/10 ${row.isLink ? 'bg-amber-500/5' : ''}`}
                    title={`Click to view ${row.sec} Bridges`}
                  >
                    <td className={`p-2.5 font-bold ${row.isLink ? 'text-amber-300' : 'text-slate-100'} flex items-center justify-between`}>
                      <span>{row.sec}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 opacity-60" />
                    </td>
                    <td className="p-2.5 text-center font-mono">{row.mjb}</td>
                    <td className="p-2.5 text-center font-mono">{row.mib}</td>
                    <td className="p-2.5 text-center font-mono">{row.rub}</td>
                    <td className="p-2.5 text-center font-mono">{row.rob}</td>
                    <td className="p-2.5 text-center font-mono">{row.fob}</td>
                    <td className="p-2.5 text-center font-mono">{row.owg}</td>
                    <td className="p-2.5 text-right font-bold font-mono text-blue-400">{row.tot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points & Crossings by Station Table (Clickable Station Filter - Requirement 2) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>🛤️ Points &amp; Crossings by Station (Total: {summary.assetCountsByCategory.pointsCrossings})</span>
            </h3>
            <span className="text-[10px] text-slate-400">Click row to filter P&amp;C</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">Station</th>
                  <th className="p-2.5">Km Range</th>
                  <th className="p-2.5 text-center">Main</th>
                  <th className="p-2.5 text-center">Loop/DS</th>
                  <th className="p-2.5 text-center">1 in 12</th>
                  <th className="p-2.5 text-center">1 in 8.5</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {[
                  { stn: 'SMUN', km: '1168.697 - 1172.297', main: 9, loop: 26, in12: 25, in85: 0, tot: 35 },
                  { stn: 'SBJN', km: '1186.837 - 1190.292', main: 7, loop: 19, in12: 21, in85: 0, tot: 26 },
                  { stn: 'NSIR', km: '1200.287 - 1204.293', main: 8, loop: 10, in12: 17, in85: 0, tot: 18 },
                  { stn: 'GVGN', km: '1211.290 - 1215.054', main: 7, loop: 25, in12: 22, in85: 0, tot: 32 },
                  { stn: 'KNNN', km: '1227.267 - 1230.845', main: 4, loop: 18, in12: 10, in85: 4, tot: 22 },
                  { stn: 'CHAN', km: '1235.837 - 1239.419', main: 6, loop: 22, in12: 23, in85: 0, tot: 28 }
                ].map((row) => (
                  <tr
                    key={row.stn}
                    onClick={() => onNavigateToAsset?.('points_crossings', undefined, row.stn)}
                    className="hover:bg-purple-600/10 cursor-pointer transition"
                    title={`Click to view ${row.stn} Turnouts / P&C`}
                  >
                    <td className="p-2.5 font-bold text-white flex items-center justify-between">
                      <span>{row.stn}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 opacity-60" />
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-slate-400">{row.km}</td>
                    <td className="p-2.5 text-center font-mono">{row.main}</td>
                    <td className="p-2.5 text-center font-mono">{row.loop}</td>
                    <td className="p-2.5 text-center font-mono">{row.in12}</td>
                    <td className="p-2.5 text-center font-mono text-amber-400 font-bold">{row.in85 > 0 ? row.in85 : '-'}</td>
                    <td className="p-2.5 text-right font-bold font-mono text-purple-400">{row.tot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Curves Breakdown by Section Table (Clickable - Requirement 2) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>🔄 Curves Breakdown by Section (Total: {summary.assetCountsByCategory.curves})</span>
            </h3>
            <span className="text-[10px] text-slate-400">Click row to filter Curves</span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                  <th className="p-2.5">Section</th>
                  <th className="p-2.5">Km Range</th>
                  <th className="p-2.5 text-center">&lt; 1.5° (Radius &gt; 1166m)</th>
                  <th className="p-2.5 text-center">&gt; 1.5° (Radius &lt; 1166m)</th>
                  <th className="p-2.5 text-right">Total Curves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {[
                  { sec: 'KRJN-SMUN', km: '1167.210 - 1170.435', less: 3, more: 0, tot: 3 },
                  { sec: 'SMUN-SBJN', km: '1170.435 - 1188.575', less: 14, more: 3, tot: 17 },
                  { sec: 'SBJN-NSIR', km: '1188.575 - 1202.015', less: 14, more: 0, tot: 14 },
                  { sec: 'NSIR-GVGN', km: '1202.015 - 1213.187', less: 4, more: 6, tot: 10 },
                  { sec: 'GVGN-KNNN', km: '1213.187 - 1229.087', less: 17, more: 2, tot: 19 },
                  { sec: 'KNNN-CHAN', km: '1229.087 - 1235.837', less: 10, more: 0, tot: 10 },
                  { sec: 'CHAN-SNL', km: '1235.837 - 1249.700', less: 9, more: 0, tot: 9 },
                  { sec: 'SMUN-RPJ', km: '1168.697 - 1178.150', less: 13, more: 0, tot: 13, isLink: true }
                ].map((row) => (
                  <tr
                    key={row.sec}
                    onClick={() => onNavigateToAsset?.('curves', row.sec)}
                    className="hover:bg-amber-600/10 cursor-pointer transition"
                    title={`Click to view ${row.sec} Curves`}
                  >
                    <td className={`p-2.5 font-bold ${row.isLink ? 'text-amber-300' : 'text-white'} flex items-center justify-between`}>
                      <span>{row.sec}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 opacity-60" />
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-slate-400">{row.km}</td>
                    <td className="p-2.5 text-center font-mono">{row.less}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-red-400">{row.more > 0 ? row.more : '-'}</td>
                    <td className="p-2.5 text-right font-bold font-mono text-amber-400">{row.tot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800/60">
        {/* Chart 1: Total Asset Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Track Assets by Category (Total: {summary.totalAssetsCount})</span>
            </h3>
          </div>
          <div className="h-64">
            <Bar data={assetChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 2: Staff Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Personnel &amp; Field Crew Distribution</span>
            </h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={staffChartData} options={donutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
