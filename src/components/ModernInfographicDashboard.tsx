/**
 * Modern High-Impact Infrastructure & Asset Infographic Dashboard
 * Grounded in Official IMSD SMUN Data & Engineering Directives
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState } from 'react';
import {
  Train,
  Layers,
  MapPin,
  GitCommit,
  Shield,
  Activity,
  Award,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Users,
  Compass,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import type { AssetCategoryKey } from './AssetCategories.tsx';

interface ModernInfographicProps {
  onNavigateToAsset?: (category: AssetCategoryKey, sectionFilter?: string, stationFilter?: string) => void;
  onNavigateToStaff?: (tab: 'officers' | 'outsourced' | 'keymen' | 'patrol' | 'watchmen') => void;
  onQuickJump?: (fromKm: string, toKm: string) => void;
}

export const ModernInfographicDashboard: React.FC<ModernInfographicProps> = ({
  onNavigateToAsset,
  onNavigateToStaff,
  onQuickJump
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('ALL');

  const STATIONS = [
    { code: 'SMUN', name: 'Shambhu (SMUN)', km: '1170.435', totalPC: 35, mainPC: 9, loopPC: 26, deg112: 25, bridges: 36, color: '#3b82f6' },
    { code: 'SBJN', name: 'Sarai Banjara (SBJN)', km: '1188.575', totalPC: 26, mainPC: 7, loopPC: 19, deg112: 21, bridges: 31, color: '#f59e0b' },
    { code: 'NSIR', name: 'Sirhind (NSIR)', km: '1202.015', totalPC: 18, mainPC: 8, loopPC: 10, deg112: 17, bridges: 30, color: '#10b981' },
    { code: 'GVGN', name: 'Mandi Gobindgarh (GVGN)', km: '1213.187', totalPC: 32, mainPC: 7, loopPC: 25, deg112: 22, bridges: 24, color: '#8b5cf6' },
    { code: 'KNNN', name: 'Khanna (KNNN)', km: '1229.087', totalPC: 22, mainPC: 4, loopPC: 18, deg112: 10, bridges: 15, color: '#06b6d4' },
    { code: 'CHAN', name: 'Chawapail (CHAN)', km: '1235.837', totalPC: 28, mainPC: 6, loopPC: 22, deg112: 23, bridges: 8, color: '#ec4899' }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Top Schematic Track Line Banner */}
      <div className="bg-gradient-to-r from-[#0d1f3d] via-[#142d55] to-[#0a1830] border border-[#203c6e] rounded-3xl p-5 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black tracking-wider uppercase">
                Dedicated Freight Corridor
              </span>
              <span className="text-xs text-amber-200/80 font-mono font-bold">
                Eastern DFC (APL-01)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              IMSD SMUN Section: Infrastructure &amp; Asset Overview
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Comprehensive inventory spanning <strong className="text-amber-300">91.943 Km</strong> (82.51 Km Main Line + 6.169 Km Link + 3.26 Km Loops), detailing bridges, track geometry, and technical assets.
            </p>
          </div>

          {/* Technical Engineering Specifications Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Rails</span>
              <span className="font-bold text-white">60kg UIC Grade 380HH</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Sleepers</span>
              <span className="font-bold text-cyan-300">PSC (1660 / Km)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Ballast Cushion</span>
              <span className="font-bold text-emerald-300">350 mm</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Broad Gauge</span>
              <span className="font-bold text-amber-300">1676 mm</span>
            </div>
          </div>
        </div>

        {/* Schematic Stations Line */}
        <div className="pt-5 overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[760px] relative">
            {/* Track Line */}
            <div className="absolute top-[28px] left-8 right-8 h-2 bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500 rounded-full opacity-80"></div>
            <div className="absolute top-[38px] left-14 right-14 h-1 bg-yellow-500/40 rounded-full border-t border-dashed border-yellow-300/60"></div>

            {/* Stations Points */}
            <div className="grid grid-cols-6 gap-2 relative z-10">
              {STATIONS.map((stn, idx) => (
                <div
                  key={stn.code}
                  onClick={() => onNavigateToAsset && onNavigateToAsset('points_crossings', undefined, stn.code)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-amber-400/80 group-hover:border-amber-300 group-hover:scale-110 transition-all flex flex-col items-center justify-center shadow-lg shadow-black/60 group-hover:shadow-amber-400/30">
                    <span className="text-[11px] font-black text-amber-300 tracking-wider">
                      {stn.code}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {stn.totalPC} P&amp;C
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white mt-2 group-hover:text-amber-300 transition-colors text-center truncate max-w-full">
                    {stn.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Km {stn.km}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Core Infographics Grid (Donut & Breakdown Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: 144 Bridge & Crossing Structures */}
        <div
          onClick={() => onNavigateToAsset && onNavigateToAsset('bridges')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Bridge &amp; Crossing Inventory
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                144 Structures
              </span>
            </div>

            {/* Central Donut Graphic & Large Number */}
            <div className="py-4 flex items-center justify-center gap-6">
              <div className="w-24 h-24 rounded-full border-8 border-orange-500 flex flex-col items-center justify-center shadow-lg shadow-orange-500/20 bg-orange-500/10">
                <span className="text-2xl font-black text-slate-900 dark:text-white">144</span>
                <span className="text-[9px] font-bold uppercase text-orange-600 dark:text-orange-400">Bridges</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span><strong>18</strong> Major Bridges (MJB)</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span><strong>74</strong> Minor Bridges (MIB)</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                  <span><strong>37</strong> Road Under Bridges (RUB)</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span><strong>9</strong> ROBs • <strong>6</strong> FOBs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Span Configurations Pill Grid */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-medium">
              <span className="text-slate-400 block">Open Web (OWG)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">5 Bridges</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-medium">
              <span className="text-slate-400 block">Box Slabs</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Multiple</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-medium">
              <span className="text-slate-400 block">Level Crossings</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">5 Active LCs</span>
            </div>
          </div>
        </div>

        {/* Card 2: 161 Points & Crossings */}
        <div
          onClick={() => onNavigateToAsset && onNavigateToAsset('points_crossings')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Track Geometry &amp; Points
              </span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                161 Total
              </span>
            </div>

            <div className="py-4 flex items-center justify-center gap-6">
              <div className="w-24 h-24 rounded-full border-8 border-amber-500 flex flex-col items-center justify-center shadow-lg shadow-amber-500/20 bg-amber-500/10">
                <span className="text-2xl font-black text-slate-900 dark:text-white">161</span>
                <span className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400">Points</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span><strong>118</strong> 1 in 12 Turnouts</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span><strong>4</strong> 1 in 8.5 Turnouts</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span><strong>39</strong> Derailing Switches</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Loop: <strong>120</strong> • Main: <strong>41</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Thick Web Curved Switch</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">CMS Crossings 60kg</span>
          </div>
        </div>

        {/* Card 3: 95 Track Curves */}
        <div
          onClick={() => onNavigateToAsset && onNavigateToAsset('curves')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Track Curves &amp; Alignment
              </span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                95 Curves
              </span>
            </div>

            <div className="py-4 flex items-center justify-center gap-6">
              <div className="w-24 h-24 rounded-full border-8 border-emerald-500 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 bg-emerald-500/10">
                <span className="text-2xl font-black text-slate-900 dark:text-white">95</span>
                <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Curves</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">
                    84 Curves (Flat &lt; 1.50°)
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    88.4% of total alignment
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
                  <div className="font-bold text-amber-800 dark:text-amber-300">
                    11 Sharper Curves (&ge; 1.50°)
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">
                    Specialized cant &amp; versine monitoring
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Max Permissible Speed</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">100 Kmph (Freight)</span>
          </div>
        </div>
      </div>

      {/* 3. Station Infrastructure Density Table & Major Bridges Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Station Infrastructure Density Table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Station-Wise Infrastructure Density
              </h3>
              <p className="text-[11px] text-slate-400">
                Points &amp; Crossings, Line Division and Turnout Angle distribution
              </p>
            </div>
            <span className="text-xs font-bold text-amber-500">6 Stations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2">Station</th>
                  <th className="pb-2 text-center">Total P&amp;C</th>
                  <th className="pb-2">Main / Loop Line</th>
                  <th className="pb-2 text-center">1 in 12 Angle</th>
                  <th className="pb-2 text-right">Bridges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {STATIONS.map(stn => (
                  <tr
                    key={stn.code}
                    onClick={() => onNavigateToAsset && onNavigateToAsset('points_crossings', undefined, stn.code)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-amber-500 mr-2">
                        {stn.code}
                      </span>
                      {stn.name.split(' ')[0]}
                    </td>
                    <td className="py-2.5 text-center font-black text-slate-900 dark:text-white">
                      {stn.totalPC}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${(stn.mainPC / stn.totalPC) * 100}%` }}
                            title={`${stn.mainPC} Main`}
                          />
                          <div
                            className="bg-amber-500 h-full"
                            style={{ width: `${(stn.loopPC / stn.totalPC) * 100}%` }}
                            title={`${stn.loopPC} Loop`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {stn.mainPC}M / {stn.loopPC}L
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {stn.deg112}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-300">
                      {stn.bridges}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notable Major Bridges & Specialized Components (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Notable Major Bridges (MJB)
              </h3>
              <p className="text-[11px] text-slate-400">
                Key river &amp; road crossings in SMUN jurisdiction
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Bridge 1177/CL/1 (OWG)</span>
                  <span className="text-[10px] text-amber-500 font-mono">132m Length</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  SMUN-RPJ Link Line • 4 x 31.10m Open Web Steel Girders
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Bridge 1175/2 (ROR)</span>
                  <span className="text-[10px] text-blue-500 font-mono">Rail Over Rail</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  SMUN-SBJN Main Line • 1x12.17m + 1x77.34m + 1x12.17m Spans
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>Bridge 1183/3 (Box Viaduct)</span>
                  <span className="text-[10px] text-emerald-500 font-mono">108m Length</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  SMUN-SBJN Section • 15 x 6.56m Multi-Box Structure
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 font-bold text-purple-800 dark:text-purple-300 text-center">
              13 SEJ Units
            </div>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 font-bold text-cyan-800 dark:text-cyan-300 text-center">
              LWR 10 (33.95 Km)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Field Workforce & Maintenance Oversight Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Field Maintenance Workforce &amp; Engineering Oversight
            </h3>
          </div>
          <button
            onClick={() => onNavigateToStaff && onNavigateToStaff('keymen')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>View Full 84 Staff Roster</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-center">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-2xl font-black text-amber-400 block">16</span>
            <span className="text-xs font-bold text-slate-200 block">Keymen</span>
            <span className="text-[10px] text-slate-400">Daily Track Inspection</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-2xl font-black text-cyan-400 block">51</span>
            <span className="text-xs font-bold text-slate-200 block">Patrolmen</span>
            <span className="text-[10px] text-slate-400">Day &amp; Night Beats</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-2xl font-black text-emerald-400 block">15</span>
            <span className="text-xs font-bold text-slate-200 block">Gatemen</span>
            <span className="text-[10px] text-slate-400">5 LC Gates (3 Shifts)</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-2xl font-black text-purple-400 block">12</span>
            <span className="text-xs font-bold text-slate-200 block">Officers &amp; Engg</span>
            <span className="text-[10px] text-slate-400">APM / Civil, Executives</span>
          </div>
        </div>
      </div>
    </div>
  );
};
