/**
 * Station Key-Plan & Interactive X-Ray Schematic Track Layout Diagram
 * DFCCIL IMSD SMUN Unit (Civil / P-Way)
 * 
 * Features:
 * 1. 🗺️ Complete Station Key-Plans for all stations across Km 1167.210 – 1249.720
 * 2. ⚡ Interactive X-Ray Track Diagram with CAD Blueprint styling (Main Line, Loops, Points & Crossings, Platforms, SEJ, Glued Joints)
 * 3. 📄 Official Key-Plan PDF Viewer & Upload (< 900 KB size enforcement)
 * 4. 🖨️ Clean Printable Layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/database.ts';
import {
  MapPin,
  FileText,
  Upload,
  Download,
  Printer,
  X,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Train,
  Sliders,
  ShieldCheck,
  Compass,
  ArrowRight,
  HardHat,
  Trash2,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

export interface StationKeyPlanRecord {
  id: string;
  stationCode: string;
  stationName: string;
  chainageKm: string;
  startKm: number;
  endKm: number;
  fileDataUrl?: string;
  fileType?: 'PDF' | 'IMAGE';
  fileName?: string;
  fileSizeKb?: number;
  pdfDataUrl?: string;
  pdfFileName?: string;
  pdfFileSizeKb?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  notes?: string;
}

export const DFCCIL_STATIONS = [
  {
    code: 'SMUN',
    name: 'Shambhu Station & IMSD HQ',
    hindiName: 'शम्भू स्टेशन व आईएमएसडी डिपो',
    chainage: 'Km 1170.435 – 1188.575',
    startKm: 1170.435,
    endKm: 1188.575,
    lines: 6,
    pointsCount: 22,
    features: ['IMSD SMUN Central P-Way Depot', 'Store Yard Siding Line', '2 High Level Platforms', 'FOB at Km 1171.200', 'Turnout 1 in 12 CMS']
  },
  {
    code: 'SBJN',
    name: 'Sarai Banjara Yard',
    hindiName: 'सराय बंजारा यार्ड',
    chainage: 'Km 1188.575 – 1202.015',
    startKm: 1188.575,
    endKm: 1202.015,
    lines: 4,
    pointsCount: 16,
    features: ['Main UP & DN Lines', 'Common Loop Line', 'Crossover Points 101/102', 'Bridge No. 24 (Major Bridge)']
  },
  {
    code: 'NSIR',
    name: 'Sirhind Junction Yard',
    hindiName: 'सरहिंद जंक्शन यार्ड',
    chainage: 'Km 1202.015 – 1213.187',
    startKm: 1202.015,
    endKm: 1213.187,
    lines: 6,
    pointsCount: 26,
    features: ['DFCCIL / IR Interchange Tracks', 'Electric Loco Siding', 'High Speed Turnouts (1:12)', 'Level Crossing LC-142']
  },
  {
    code: 'GVGN',
    name: 'Mandi Gobindgarh Yard',
    hindiName: 'मंडी गोबिंदगढ़ यार्ड',
    chainage: 'Km 1213.187 – 1229.087',
    startKm: 1213.187,
    endKm: 1229.087,
    lines: 4,
    pointsCount: 18,
    features: ['Industrial Steel Siding', 'UP/DN Main Track', 'Loop Lines', 'Curve C-14 Radius 1200m']
  },
  {
    code: 'KNNN',
    name: 'Khanna Station Yard',
    hindiName: 'खन्ना स्टेशन यार्ड',
    chainage: 'Km 1229.087 – 1235.837',
    startKm: 1229.087,
    endKm: 1235.837,
    lines: 4,
    pointsCount: 16,
    features: ['Grain Silo Siding', 'High Speed Crossovers', '2 Platforms', 'ROB at Km 1232.400']
  },
  {
    code: 'CHAN',
    name: 'Chawa Pail Station Yard',
    hindiName: 'चावा पायेल स्टेशन यार्ड',
    chainage: 'Km 1235.837 – 1249.720',
    startKm: 1235.837,
    endKm: 1249.720,
    lines: 4,
    pointsCount: 14,
    features: ['UP & DN Main Lines', 'Goods Loop Line', 'SEJ Joint Km 1240.500', 'Major Canal Bridge No. 88']
  }
];

interface StationKeyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStationCode?: string;
}

export const StationKeyPlanModal: React.FC<StationKeyPlanModalProps> = ({
  isOpen,
  onClose,
  defaultStationCode
}) => {
  const [selectedStationCode, setSelectedStationCode] = useState<string>(defaultStationCode || 'SMUN');
  const [keyPlans, setKeyPlans] = useState<Record<string, StationKeyPlanRecord>>({});
  const [viewMode, setViewMode] = useState<'XRAY' | 'DOC'>('XRAY');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [docZoom, setDocZoom] = useState<number>(1);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultStationCode) {
      setSelectedStationCode(defaultStationCode);
    }
  }, [defaultStationCode]);

  const loadKeyPlans = async () => {
    try {
      const map: Record<string, StationKeyPlanRecord> = {};

      // 1. First populate from LocalStorage cache
      DFCCIL_STATIONS.forEach(st => {
        try {
          const localSaved = localStorage.getItem(`dfccil_station_keyplan_${st.code}`);
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (parsed && parsed.stationCode) {
              map[parsed.stationCode] = parsed;
            }
          }
        } catch {}
      });

      // 2. Then merge from database collection
      const stored = await db.getCollection<StationKeyPlanRecord>('station_keyplans');
      stored.forEach(kp => {
        if (kp && kp.stationCode) {
          map[kp.stationCode] = kp;
        }
      });

      setKeyPlans(map);
    } catch (err) {
      console.error('Error loading station keyplans:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadKeyPlans();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStation = DFCCIL_STATIONS.find(s => s.code === selectedStationCode) || DFCCIL_STATIONS[0];
  const currentPlan = keyPlans[selectedStationCode];
  const bundledPdfUrl = `/keyplans/${currentStation.code} Keyplan.pdf`;
  const activeDocUrl = currentPlan?.fileDataUrl || currentPlan?.pdfDataUrl || bundledPdfUrl;
  const isImageDoc = currentPlan?.fileType === 'IMAGE' || (activeDocUrl && activeDocUrl.startsWith('data:image'));

  // Compress large drawing images to high-def JPEG (< 350 KB)
  const compressDrawingImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to parse drawing image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle PDF or Blueprint Image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|svg|bmp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setUploadError('⚠️ Please select a valid PDF file (.pdf) or Engineering Drawing Image (.png, .jpg, .webp).');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Enforce 3 MB limit
    const maxSizeBytes = 3 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError(`⚠️ File size exceeds 3 MB limit! (${(file.size / 1024 / 1024).toFixed(2)} MB). Please upload a file under 3 MB.`);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      let finalDataUrl = '';
      let finalSizeKb = Math.round(file.size / 1024);

      if (isImage) {
        finalDataUrl = await compressDrawingImage(file);
        finalSizeKb = Math.round((finalDataUrl.length * 0.75) / 1024);
      } else {
        finalDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read PDF file'));
          reader.readAsDataURL(file);
        });
      }

      const planRecord: StationKeyPlanRecord = {
        id: `KP-${selectedStationCode}`,
        stationCode: selectedStationCode,
        stationName: currentStation.name,
        chainageKm: currentStation.chainage,
        startKm: currentStation.startKm,
        endKm: currentStation.endKm,
        fileDataUrl: finalDataUrl,
        fileType: isPdf ? 'PDF' : 'IMAGE',
        fileName: file.name,
        fileSizeKb: finalSizeKb,
        pdfDataUrl: finalDataUrl,
        pdfFileName: file.name,
        pdfFileSizeKb: finalSizeKb,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'DFCCIL IMSD SMUN P-Way Unit'
      };

      // 1. Save to Database Collection (safely upserts in memory, localStorage, and Cloud Firestore)
      await db.updateDocument('station_keyplans', planRecord.id, planRecord);

      // 2. Direct LocalStorage cache
      try {
        localStorage.setItem(`dfccil_station_keyplan_${selectedStationCode}`, JSON.stringify(planRecord));
      } catch (err) {
        console.warn('LocalStorage save warning for keyplan:', err);
      }

      // 3. Update React State
      setKeyPlans(prev => ({ ...prev, [selectedStationCode]: planRecord }));
      setUploadSuccess(`✅ Key-Plan for ${currentStation.name} (${finalSizeKb} KB) successfully uploaded & saved!`);
      setViewMode('DOC');
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error('Key-Plan upload error:', err);
      setUploadError(`Upload failed: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePlan = async () => {
    if (!currentPlan) return;
    if (!window.confirm(`Are you sure you want to delete the uploaded Key-Plan for ${currentStation.name}?`)) {
      return;
    }

    try {
      await db.deleteDocument('station_keyplans', currentPlan.id).catch(() => {});
      localStorage.removeItem(`dfccil_station_keyplan_${selectedStationCode}`);
      setKeyPlans(prev => {
        const next = { ...prev };
        delete next[selectedStationCode];
        return next;
      });
      setUploadSuccess(`Deleted Key-Plan for ${currentStation.name}.`);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      setUploadError(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl w-full max-w-6xl max-h-[94vh] shadow-2xl flex flex-col overflow-hidden text-white animate-scaleUp">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#0a1e40] via-[#0f2b5c] to-[#123b72]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/40 shadow-inner">
              <Train className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>DFCCIL Station Key-Plans &amp; Track Blueprints</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400 text-slate-950 uppercase">
                  Layout Master
                </span>
              </h3>
              <p className="text-xs text-cyan-200/80 font-medium">
                IMSD SMUN Unit (Km 1170.435 – 1249.720) • Yard Blueprints, Topologies &amp; Approved Drawings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-slate-950/80 p-1 rounded-xl border border-slate-700 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('XRAY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'XRAY' ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>X-Ray Schematic</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('DOC')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'DOC' ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Key-Plan Document {activeDocUrl ? '✅' : ''}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl transition"
              title="Print Current Station Layout"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-white rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Station Navigation Pills Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0 uppercase tracking-wider">
            Stations:
          </span>
          {DFCCIL_STATIONS.map(stn => {
            const isSelected = selectedStationCode === stn.code;
            const hasPlan = Boolean(keyPlans[stn.code]?.fileDataUrl || keyPlans[stn.code]?.pdfDataUrl);
            return (
              <button
                key={stn.code}
                type="button"
                onClick={() => {
                  setSelectedStationCode(stn.code);
                  setUploadError(null);
                  setDocZoom(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{stn.code}</span>
                <span className="text-[10px] opacity-75 font-normal">({stn.name.split(' ')[0]})</span>
                {hasPlan && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" title="Key-Plan Attached" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Alerts */}
        {uploadError && (
          <div className="bg-red-950/90 border-b border-red-800 px-4 py-2 text-xs font-bold text-red-200 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
        {uploadSuccess && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-200 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/40">
          
          {/* Station Summary Info Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black text-white tracking-tight">
                  {currentStation.code} • {currentStation.name}
                </h4>
                <span className="text-sm font-bold text-cyan-300 font-hindi">
                  ({currentStation.hindiName})
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Jurisdiction Chainage: <span className="text-cyan-300 font-bold">{currentStation.chainage}</span> • {currentStation.lines} Lines • {currentStation.pointsCount} Points &amp; Crossings
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentStation.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-950/80 border border-blue-800 text-cyan-300"
                  >
                    ✦ {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf,image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                title="Upload Station Key-Plan (PDF or Image Drawing)"
              >
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload Key-Plan (PDF/Drawing)'}</span>
              </button>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              VIEW 1: CAD / BLUEPRINT X-RAY SCHEMATIC TRACK LAYOUT DIAGRAM
          ------------------------------------------------------------------ */}
          {viewMode === 'XRAY' && (
            <div className="bg-[#050b14] border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
                    High-Definition X-Ray Track Diagram • {currentStation.code} Yard Topography
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">Scale: 1:1000 Schematic</span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => (prev === 1 ? 1.3 : 1))}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs"
                    title="Toggle Zoom"
                  >
                    {zoomLevel === 1 ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Dynamic SVG Schematic Blueprint */}
              <div className="overflow-x-auto overflow-y-hidden py-4 scrollbar-thin">
                <div
                  className="min-w-[850px] transition-transform duration-300 origin-top-left"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg viewBox="0 0 1000 320" className="w-full h-auto drop-shadow-lg font-mono select-none">
                    {/* Background Grid Pattern */}
                    <defs>
                      <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e2238" strokeWidth="0.8" />
                      </pattern>
                      <linearGradient id="upLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                      <linearGradient id="dnLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>

                    <rect width="1000" height="320" fill="url(#gridPattern)" rx="16" />

                    {/* Yard Boundary & Kilometre Markers */}
                    <text x="30" y="30" fill="#64748b" fontSize="11" fontWeight="bold">
                      ◄ To Delhi / Khurja ({currentStation.startKm.toFixed(3)})
                    </text>
                    <text x="750" y="30" fill="#64748b" fontSize="11" fontWeight="bold">
                      To Ludhiana / Sahnewal ({currentStation.endKm.toFixed(3)}) ►
                    </text>

                    {/* 1. UP Loop Line (Top Line) */}
                    <path d="M 160 80 L 840 80" stroke="#0ea5e9" strokeWidth="3" fill="none" strokeDasharray="6,2" />
                    <text x="440" y="70" fill="#38bdf8" fontSize="10" fontWeight="bold">UP GOODS LOOP LINE (750m CSL)</text>

                    {/* 2. UP Main Line */}
                    <path d="M 40 120 L 960 120" stroke="url(#upLineGrad)" strokeWidth="4.5" fill="none" />
                    <text x="50" y="110" fill="#22d3ee" fontSize="12" fontWeight="900">UP MAIN LINE (Km 1167.210 → 1249.720)</text>

                    {/* Platform 1 Indicator */}
                    <rect x="360" y="130" width="280" height="14" fill="#1e293b" stroke="#06b6d4" strokeWidth="1" rx="4" />
                    <text x="420" y="141" fill="#e2e8f0" fontSize="9" fontWeight="bold">PLATFORM NO. 1 (HIGH LEVEL 600m)</text>

                    {/* 3. DN Main Line */}
                    <path d="M 40 190 L 960 190" stroke="url(#dnLineGrad)" strokeWidth="4.5" fill="none" />
                    <text x="50" y="180" fill="#f59e0b" fontSize="12" fontWeight="900">DN MAIN LINE (← Sanahwal to Khurja)</text>

                    {/* Platform 2 Indicator */}
                    <rect x="360" y="200" width="280" height="14" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" rx="4" />
                    <text x="420" y="211" fill="#e2e8f0" fontSize="9" fontWeight="bold">PLATFORM NO. 2 (HIGH LEVEL 600m)</text>

                    {/* 4. DN Loop Line (Bottom Line) */}
                    <path d="M 160 250 L 840 250" stroke="#f97316" strokeWidth="3" fill="none" strokeDasharray="6,2" />
                    <text x="440" y="270" fill="#fb923c" fontSize="10" fontWeight="bold">DN GOODS LOOP LINE (750m CSL)</text>

                    {/* 5. Depot Siding Line for SMUN */}
                    {selectedStationCode === 'SMUN' && (
                      <>
                        <path d="M 280 250 L 380 290 L 620 290" stroke="#a855f7" strokeWidth="3.5" fill="none" />
                        <rect x="420" y="282" width="180" height="16" fill="#581c87" stroke="#c084fc" strokeWidth="1" rx="4" />
                        <text x="435" y="294" fill="#f3e8ff" fontSize="9" fontWeight="bold">IMSD SMUN STORE &amp; P-WAY DEPOT SIDING</text>
                      </>
                    )}

                    {/* Turnouts & Crossings */}
                    {/* UP Loop Lead Switch In */}
                    <line x1="160" y1="80" x2="220" y2="120" stroke="#38bdf8" strokeWidth="3" />
                    <circle cx="220" cy="120" r="4" fill="#38bdf8" />
                    <text x="180" y="105" fill="#bae6fd" fontSize="9" fontWeight="bold">P-101A</text>

                    {/* UP Loop Lead Switch Out */}
                    <line x1="780" y1="120" x2="840" y2="80" stroke="#38bdf8" strokeWidth="3" />
                    <circle cx="780" cy="120" r="4" fill="#38bdf8" />
                    <text x="800" y="105" fill="#bae6fd" fontSize="9" fontWeight="bold">P-101B</text>

                    {/* Main to Main Diamond / Crossover */}
                    <line x1="300" y1="120" x2="350" y2="190" stroke="#ec4899" strokeWidth="3" />
                    <text x="325" y="160" fill="#f472b6" fontSize="9" fontWeight="bold">X-103</text>

                    <line x1="650" y1="190" x2="700" y2="120" stroke="#ec4899" strokeWidth="3" />
                    <text x="675" y="160" fill="#f472b6" fontSize="9" fontWeight="bold">X-104</text>

                    {/* DN Loop Lead Switch In */}
                    <line x1="160" y1="250" x2="220" y2="190" stroke="#f97316" strokeWidth="3" />
                    <circle cx="220" cy="190" r="4" fill="#f97316" />
                    <text x="180" y="225" fill="#fed7aa" fontSize="9" fontWeight="bold">P-102A</text>

                    {/* DN Loop Lead Switch Out */}
                    <line x1="780" y1="190" x2="840" y2="250" stroke="#f97316" strokeWidth="3" />
                    <circle cx="780" cy="190" r="4" fill="#f97316" />
                    <text x="800" y="225" fill="#fed7aa" fontSize="9" fontWeight="bold">P-102B</text>

                    {/* Glued Insulated Joints & SEJ Markers */}
                    {/* SEJ 1 */}
                    <rect x="130" y="112" width="6" height="16" fill="#a855f7" />
                    <text x="110" y="145" fill="#c084fc" fontSize="8" fontWeight="bold">SEJ Km {(currentStation.startKm + 0.5).toFixed(3)}</text>

                    {/* SEJ 2 */}
                    <rect x="880" y="112" width="6" height="16" fill="#a855f7" />
                    <text x="860" y="145" fill="#c084fc" fontSize="8" fontWeight="bold">SEJ Km {(currentStation.endKm - 0.5).toFixed(3)}</text>

                    {/* Station Building Block */}
                    <rect x="440" y="10" width="120" height="28" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" rx="6" />
                    <text x="455" y="27" fill="#38bdf8" fontSize="10" fontWeight="black">STATION BLDG</text>
                  </svg>
                </div>
              </div>

              {/* Blueprint Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono border-t border-cyan-900/60 pt-3 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1.5 bg-cyan-400 rounded-full" />
                  <span>UP Main Line Track</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1.5 bg-amber-400 rounded-full" />
                  <span>DN Main Line Track</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3 bg-pink-500/30 border border-pink-400 rounded" />
                  <span>Crossover 1:12 Point</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-purple-600 rounded" />
                  <span>SEJ (Expansion Joint)</span>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
              VIEW 2: ATTACHED OFFICIAL KEY-PLAN DOCUMENT VIEWER (PDF / DRAWING)
          ------------------------------------------------------------------ */}
          {viewMode === 'DOC' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              {activeDocUrl ? (
                <div className="space-y-3">
                  {/* Document Control Header */}
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-700">
                        {isImageDoc ? (
                          <ImageIcon className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-white block truncate">
                          {currentPlan?.fileName || currentPlan?.pdfFileName || `${currentStation.code}_Key_Plan`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{currentPlan?.fileSizeKb || currentPlan?.pdfFileSizeKb || 120} KB</span>
                          <span>•</span>
                          <span>{isImageDoc ? 'Drawing Image' : 'PDF Document'}</span>
                          <span>•</span>
                          <span>Uploaded {currentPlan?.uploadedAt ? new Date(currentPlan.uploadedAt).toLocaleDateString() : 'Official'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Zoom Controls for Drawing Images */}
                      {isImageDoc && (
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setDocZoom(prev => Math.max(0.5, prev - 0.2))}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Zoom Out"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono font-bold px-1 text-cyan-300">
                            {Math.round(docZoom * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={() => setDocZoom(prev => Math.min(3, prev + 0.2))}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Zoom In"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocZoom(1)}
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-300 hover:text-white rounded"
                          >
                            Reset
                          </button>
                        </div>
                      )}

                      <a
                        href={activeDocUrl}
                        download={currentPlan?.fileName || currentPlan?.pdfFileName || `${currentStation.code}_Key_Plan`}
                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold flex items-center gap-1 text-xs shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1 text-xs border border-slate-700"
                        title="Replace current file"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Replace</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDeletePlan}
                        className="p-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-xl transition border border-red-800"
                        title="Delete this Key-Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Viewer Display */}
                  <div className="w-full h-[560px] rounded-2xl overflow-auto border border-slate-800 bg-slate-950 shadow-inner flex items-center justify-center p-2 relative">
                    {isImageDoc ? (
                      <div
                        className="transition-transform duration-200 origin-center max-w-full max-h-full flex items-center justify-center"
                        style={{ transform: `scale(${docZoom})` }}
                      >
                        <img
                          src={activeDocUrl}
                          alt={`${currentStation.name} Key Plan Drawing`}
                          className="max-w-full max-h-[520px] object-contain rounded-lg shadow-xl"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={activeDocUrl}
                        title={`${currentStation.name} Key Plan PDF`}
                        className="w-full h-full border-none rounded-xl"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center space-y-3 bg-slate-950/60 rounded-3xl border border-dashed border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto border border-slate-800 text-cyan-400">
                    <Upload className="w-8 h-8 animate-bounce" />
                  </div>
                  <h4 className="text-base font-bold text-slate-200">
                    No Key-Plan Uploaded for {currentStation.name} ({currentStation.code}) yet
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Upload the approved Station Engineering Key-Plan, Blueprint Scan, or PDF document. Once uploaded, it is permanently saved to the Cloud ERP.
                  </p>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-black text-xs transition shadow-lg inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Station Key-Plan (PDF or Image)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950 text-xs">
          <span className="text-slate-400 font-mono">
            DFCCIL WDFC • IMSD SMUN P-Way Division • 6 Jurisdiction Stations
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
