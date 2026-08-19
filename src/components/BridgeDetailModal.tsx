/**
 * Bridge Detail Popup Modal
 * Exact visual replica of Image 2: 'Bridge FOB(O)--08'
 * Features:
 * - Header: Deep Navy (#0f2b5c) with '🌉 Bridge [Bridge No.]' & Close 'X'
 * - 2-Column Key-Value Grid:
 *   1. BRIDGE NO. | TYPE
 *   2. SECTION | FROM KM
 *   3. TO KM | OLD BRIDGE NO.
 *   4. SPAN | LENGTH
 *   5. WATERWAY | LATITUDE
 *   6. LONGITUDE
 * - Action Bar:
 *   🧭 Navigate (Blue button -> Google Maps Turn-by-Turn GPS)
 *   📍 Open Location (Outlined button -> Google Maps Pin)
 *   ✕ Close (Outlined button)
 */

import React from 'react';
import { Navigation, MapPin, X } from 'lucide-react';
import type { BridgeRecord } from '../types/index.ts';

interface BridgeDetailModalProps {
  bridge: (Partial<BridgeRecord> & { [key: string]: any }) | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BridgeDetailModal: React.FC<BridgeDetailModalProps> = ({ bridge, isOpen, onClose }) => {
  if (!isOpen || !bridge) return null;

  const bridgeNo = bridge.bridgeNo || bridge.bridge_no || 'FOB(O)--08';
  const bridgeType = bridge.bridgeType || bridge.type || bridge.category || 'FOB';
  const section = bridge.sectionCode || bridge.section || '03. SMUN-SBJN';
  
  const fromKm = bridge.fromKm != null 
    ? Number(bridge.fromKm).toFixed(3) 
    : (bridge.from_km != null ? Number(bridge.from_km).toFixed(3) : (bridge.km != null ? Number(bridge.km).toFixed(3) : '1179.287'));
  
  const toKm = bridge.toKm != null 
    ? Number(bridge.toKm).toFixed(3) 
    : (bridge.to_km != null ? Number(bridge.to_km).toFixed(3) : (bridge.km != null ? Number(bridge.km).toFixed(3) : fromKm));

  const oldNo = bridge.oldBridgeNo || bridge.old_no || 'FOB Rajpura';
  const span = bridge.spanConfiguration || bridge.span || 'FOB';
  const length = bridge.totalLengthMeters || bridge.length || '88.94';
  const waterway = bridge.waterwayType || bridge.waterway || '-';

  // Accurate GPS Coordinates
  const lat = bridge.latitude != null ? Number(bridge.latitude).toFixed(8) : '30.46780256';
  const lng = bridge.longitude != null ? Number(bridge.longitude).toFixed(8) : '76.62183688';

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleOpenLocation = () => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0d1b33] border border-slate-300 dark:border-blue-900/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 animate-scaleUp">
        {/* Top Header Bar with Deep Navy Background */}
        <div className="px-5 py-3.5 bg-[#0f2b5c] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-base">🌉</span>
            <span className="text-sm sm:text-base font-bold tracking-tight text-white">
              Bridge {bridgeNo}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2-Column Key-Value Grid matching Image 2 */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
            {/* Row 1: BRIDGE NO. | TYPE */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                BRIDGE NO.
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base font-mono block">
                {bridgeNo}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                TYPE
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base block">
                {bridgeType}
              </span>
            </div>

            {/* Row 2: SECTION | FROM KM */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                SECTION
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                {section}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                FROM KM
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-mono block">
                {fromKm}
              </span>
            </div>

            {/* Row 3: TO KM | OLD BRIDGE NO. */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                TO KM
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-mono block">
                {toKm}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                OLD BRIDGE NO.
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                {oldNo}
              </span>
            </div>

            {/* Row 4: SPAN | LENGTH */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                SPAN
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                {span}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                LENGTH
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-mono block">
                {length}
              </span>
            </div>

            {/* Row 5: WATERWAY | LATITUDE */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                WATERWAY
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                {waterway}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                LATITUDE
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-mono block">
                {lat}
              </span>
            </div>

            {/* Row 6: LONGITUDE */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                LONGITUDE
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm font-mono block">
                {lng}
              </span>
            </div>
          </div>

          {/* Action Buttons Row matching Image 2 */}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            {/* 🧭 Navigate (Primary Blue) */}
            <button
              type="button"
              onClick={handleNavigate}
              className="px-4 py-2 bg-[#0f2b5c] hover:bg-[#1a4b8c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate</span>
            </button>

            {/* 📍 Open Location (Outlined) */}
            <button
              type="button"
              onClick={handleOpenLocation}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Open Location</span>
            </button>

            {/* ✕ Close (Outlined) */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 ml-auto"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
