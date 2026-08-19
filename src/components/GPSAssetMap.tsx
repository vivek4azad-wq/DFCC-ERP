/**
 * Official GPS Jurisdiction Map & Bridges Telemetry Viewer
 * DFCCIL IMSD SMUN Unit (Km 1167.210 – 1249.720 + Link Line 6.169 Km = 88.679 Km)
 * 
 * Approved Google My Map Source:
 * https://www.google.com/maps/d/edit?mid=1HEYKU7l_wM22pnXImgSH2NeDhkn6Xmw&usp=sharing
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/database.ts';
import { launchNavigation } from '../services/geo.ts';
import { BridgeLinearDiagram } from './BridgeLinearDiagram.tsx';
import { BridgeDetailModal } from './BridgeDetailModal.tsx';
import {
  MapPin,
  Navigation,
  Train,
  Layers,
  Filter,
  Search,
  ExternalLink,
  Shield,
  Compass,
  Maximize2
} from 'lucide-react';
import type { BridgeRecord } from '../types/index.ts';

const APPROVED_MY_MAP_EMBED = 'https://www.google.com/maps/d/embed?mid=1HEYKU7l_wM22pnXImgSH2NeDhkn6Xmw';
const APPROVED_MY_MAP_URL = 'https://www.google.com/maps/d/edit?mid=1HEYKU7l_wM22pnXImgSH2NeDhkn6Xmw&usp=sharing';

export const GPSAssetMap: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'linear' | 'cards'>('map');
  const [bridges, setBridges] = useState<BridgeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');
  const [selectedBridgeForModal, setSelectedBridgeForModal] = useState<BridgeRecord | null>(null);

  const loadBridges = async () => {
    try {
      setIsLoading(true);
      const brgList = await db.getCollection<BridgeRecord>('bridges');
      setBridges(brgList);
    } catch (err) {
      console.error('Failed to load bridges for GPS map:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBridges();
    const unsub = db.subscribe(() => {
      loadBridges();
    });
    return () => {
      unsub();
    };
  }, []);

  const filteredBridges = useMemo(() => {
    return bridges.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        b.bridgeNo.toLowerCase().includes(q) ||
        (b.oldBridgeNo || '').toLowerCase().includes(q) ||
        b.sectionCode.toLowerCase().includes(q) ||
        String(b.fromKm || b.km).includes(q);
      const matchType =
        selectedTypeFilter === 'ALL' ||
        b.category === selectedTypeFilter ||
        (b.bridgeType || '').includes(selectedTypeFilter);
      const matchSec =
        selectedSectionFilter === 'ALL' || b.sectionCode.includes(selectedSectionFilter);
      return matchQ && matchType && matchSec;
    });
  }, [bridges, searchQuery, selectedTypeFilter, selectedSectionFilter]);

  const handleLaunchMaps = (bridge: BridgeRecord) => {
    launchNavigation(bridge.latitude, bridge.longitude, `Bridge ${bridge.bridgeNo}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Official GPS Jurisdiction Map &amp; Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              IMSD SMUN Unit (Km 1167.210 – 1249.720 + Link Line 6.169 Km)
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🗺️ Jurisdiction Map</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('linear')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'linear'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>📐 Linear Schematic</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🌉 Bridges Cards ({bridges.length})</span>
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          1. APPROVED GOOGLE MY MAP EMBEDDED IFRAME
      ------------------------------------------------------------------ */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <strong>Live DFCCIL Jurisdiction Google My Map</strong>
              </div>

              <a
                href={APPROVED_MY_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shadow-md self-start sm:self-auto"
              >
                <span>Open in Google Maps App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Responsive Map Frame */}
            <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <iframe
                src={APPROVED_MY_MAP_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                title="DFCCIL IMSD SMUN Official Jurisdiction Map"
              />
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          2. LINEAR DIAGRAM
      ------------------------------------------------------------------ */}
      {viewMode === 'linear' && <BridgeLinearDiagram />}

      {/* -----------------------------------------------------------------
          3. BRIDGES GPS TELEMETRY CARDS (144)
      ------------------------------------------------------------------ */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search bridge by number, old number, or Km..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="FOB">Foot Over Bridge (FOB)</option>
                <option value="ROB">Road Over Bridge (ROB)</option>
                <option value="RUB">Road Under Bridge (RUB)</option>
                <option value="MAJOR">Major Bridge (MJB)</option>
                <option value="MINOR">Minor Bridge (MIB)</option>
              </select>
            </div>
          </div>

          {/* Bridges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBridges.map(b => (
              <div
                key={b.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-5 rounded-2xl space-y-4 transition group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        {b.bridgeType || b.category}
                      </span>
                      <h3
                        onClick={() => setSelectedBridgeForModal(b)}
                        className="text-base font-bold text-white group-hover:text-cyan-300 transition font-mono cursor-pointer"
                      >
                        Bridge {b.bridgeNo}
                      </h3>
                      {b.oldBridgeNo && (
                        <p className="text-xs text-cyan-400 font-mono font-medium">
                          Old: {b.oldBridgeNo}
                        </p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono font-bold rounded-lg">
                      Km {Number(b.fromKm || b.km).toFixed(3)}
                    </span>
                  </div>

                  <div className="mt-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Span:</span>
                      <span className="text-slate-200 font-semibold">{b.spanConfiguration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Section:</span>
                      <span className="text-slate-300">{b.sectionCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Length:</span>
                      <span className="text-slate-300 font-mono">{b.totalLengthMeters ? `${b.totalLengthMeters} m` : '-'}</span>
                    </div>
                  </div>

                  {/* Exact GPS Coordinates Box */}
                  {b.latitude > 0 && b.longitude > 0 ? (
                    <div className="mt-3 p-2 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-mono">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{b.latitude.toFixed(6)}°, {b.longitude.toFixed(6)}°</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">GPS Match</span>
                    </div>
                  ) : (
                    <div className="mt-3 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500 font-mono text-center">
                      No exact GPS match available.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedBridgeForModal(b)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition text-center"
                  >
                    Details
                  </button>

                  {b.latitude > 0 && b.longitude > 0 && (
                    <button
                      type="button"
                      onClick={() => handleLaunchMaps(b)}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-md"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bridge Detail Modal */}
      <BridgeDetailModal
        bridge={selectedBridgeForModal}
        isOpen={Boolean(selectedBridgeForModal)}
        onClose={() => setSelectedBridgeForModal(null)}
      />
    </div>
  );
};
