/**
 * Official About & Development Attribution Modal
 * DFCCIL IMSD SMUN Unit
 */

import React from 'react';
import {
  Shield,
  Train,
  X,
  User,
  MapPin,
  CheckCircle2,
  Layers,
  Sparkles,
  Phone,
  Mail,
  Heart
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-blue-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative">
        {/* Top Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
              <Train className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">About DFCCIL ERP</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Logo & Emblem */}
          <div className="w-20 h-20 rounded-3xl overflow-hidden p-0.5 mx-auto shadow-2xl shadow-blue-600/40 border-2 border-blue-400/40 bg-[#0d234a]">
            <img src="/logo.png" alt="DFCCIL ERP Logo" className="w-full h-full object-cover rounded-[22px]" />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-white">DFCCIL ERP</h3>
            <p className="text-xs text-blue-400 font-mono font-semibold mt-0.5">
              IMSD SMUN UNIT • Version 2.0.0
            </p>
          </div>

          {/* Attribution Box */}
          <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-4 text-left space-y-3 shadow-inner">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              System Architecture &amp; Development
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Developed by</span>
                  <span className="font-bold text-white text-sm block">Vivek Kumar Azad</span>
                  <span className="text-blue-300 font-medium block">
                    Assistant Project Manager / Civil
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Jurisdiction Unit</span>
                  <span className="text-slate-200 font-medium">
                    DFCCIL — IMSD SMUN Unit (New Shambhu)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Corridor Coverage</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    Km 1167.210 – 1249.720 (82.51 Km Main Line) + Link Line (6.169 Km) — Total 88.679 Km
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Dedicated Freight Corridor Corporation of India Limited
            <br />
            (A Government of India Enterprise under Ministry of Railways)
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
