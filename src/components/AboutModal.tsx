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
  Heart,
  Award,
  ExternalLink,
  Code
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-[#0b1b36] via-slate-950 to-[#070f1e] border-2 border-amber-400/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block">DFCCIL IMSD SMUN ERP</span>
              <span className="text-[10px] text-amber-300/80 font-medium">Dedicated Freight Corridor Corporation of India Ltd.</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-center">
          {/* Official Portrait of Shri Vivek Kumar Azad */}
          <div className="relative mx-auto w-32 h-32 rounded-3xl p-1 bg-gradient-to-br from-amber-400 via-orange-500 to-blue-600 shadow-2xl shadow-amber-500/20 group">
            <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-900 border-2 border-slate-900 relative">
              <img
                src="/vk_azad_apm.jpg"
                alt="Shri Vivek Kumar Azad"
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-md whitespace-nowrap">
              APM / Civil
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
              <span>Shri Vivek Kumar Azad</span>
              <Award className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-amber-300 font-semibold mt-0.5">
              Assistant Project Manager / Civil (Unit Incharge)
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Lead Architect &amp; Software Developer • DFCCIL IMSD SMUN Unit
            </p>
          </div>

          {/* Attribution Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-inner">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Unit Leadership &amp; Engineering Oversight</span>
              <span className="text-[10px] text-slate-400 font-mono">EMP-101518</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Jurisdiction Unit</span>
                  <span className="text-slate-200 font-bold">
                    IMSD SMUN (New Shambhu Depot &amp; Yard)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Corridor Chainage</span>
                  <span className="text-slate-300 font-mono text-[11px] font-semibold">
                    Km 1167.210 – 1249.720 (82.51 Km Main Line) + Link Line (6.169 Km) = Total 88.679 Km
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Code className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Technical Innovations</span>
                  <span className="text-slate-300 text-[11px]">
                    DFCCIL Broad Gauge Curve Calculator • 3D Track Manuals • P-Way Quality Inspection Suite
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1 border-t border-slate-800/80">
                <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Official Contact</span>
                    <a href="tel:8872671873" className="text-amber-300 font-mono font-bold hover:underline">
                      +91 8872671873
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Email</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      vkazad@dfcc.co.in
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>DFCCIL ERP Version 2.4</span>
            <span className="text-amber-400 font-semibold">Eastern DFC APL-01</span>
          </div>
        </div>
      </div>
    </div>
  );
};
