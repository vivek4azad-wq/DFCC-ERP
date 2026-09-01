/**
 * DFCCIL Railway (BG) Technical Software & Calculator Suite
 * Module: Track & Curve Engineering Tools
 * Author: Shri Vivek Kumar Azad (APM / Civil)
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState } from 'react';
import {
  Calculator,
  ExternalLink,
  Maximize2,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export const TrackSoftwareViewer: React.FC = () => {
  const [iframeKey, setIframeKey] = useState(0);

  const handleOpenNewWindow = () => {
    window.open('/calculator/index.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full gap-3 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a1e3f] via-[#102e5d] to-[#061226] border border-[#1e4079] rounded-2xl p-4 shadow-xl text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <Calculator className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                DFCCIL Railway (BG) Curve Calculator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 font-black uppercase tracking-wider">
                  Official Software
                </span>
              </h1>
            </div>
            <p className="text-xs text-cyan-200/80 font-medium">
              Authored by <strong className="text-white">Shri Vivek Kumar Azad</strong> (APM / Civil) • Complete Broad Gauge Curve Design Suite
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            title="Reload Calculator"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
          
          <button
            onClick={handleOpenNewWindow}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 border border-cyan-300/40 hover:scale-105"
            title="Open standalone in a new full browser window"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Window ↗</span>
          </button>
        </div>
      </div>

      {/* Main Software Viewport */}
      <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl relative min-h-0">
        <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Interactive Engineering Canvas • MathJax 3 & Chart.js Enabled</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/calculator/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </a>
          </div>
        </div>

        <div className="flex-1 w-full h-full bg-[#ecf0f1] relative overflow-hidden">
          <iframe
            key={iframeKey}
            src="/calculator/index.html"
            className="w-full h-full border-0 absolute inset-0"
            title="DFCCIL Railway (BG) Curve Calculator"
          />
        </div>
      </div>
    </div>
  );
};
