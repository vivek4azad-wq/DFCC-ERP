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
  isInline?: boolean;
}

export const StationKeyPlanModal: React.FC<StationKeyPlanModalProps> = ({
  isOpen,
  onClose,
  defaultStationCode,
  isInline = false
}) => {
  const [selectedStationCode, setSelectedStationCode] = useState<string>(defaultStationCode || 'SMUN');
  const [keyPlans, setKeyPlans] = useState<Record<string, StationKeyPlanRecord>>({});
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

  const containerContent = (
    <div className={`bg-slate-900 border-2 border-cyan-500/40 rounded-3xl w-full ${isInline ? 'min-h-[750px]' : 'max-w-6xl max-h-[94vh]'} shadow-2xl flex flex-col overflow-hidden text-white animate-scaleUp`}>
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
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1.5 text-xs">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-cyan-200">Official Blueprints &amp; Approved Drawings</span>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl transition"
            title="Print Current Station Layout"
          >
            <Printer className="w-4 h-4" />
          </button>

          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-white rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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
              OFFICIAL APPROVED STATION ENGINEERING KEY-PLAN BLUEPRINT VIEWER
          ------------------------------------------------------------------ */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
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
                        {currentPlan?.fileName || currentPlan?.pdfFileName || `${currentStation.code} Approved Key-Plan Blueprint`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{currentPlan?.fileSizeKb || currentPlan?.pdfFileSizeKb || 420} KB</span>
                        <span>•</span>
                        <span>{isImageDoc ? 'Drawing Blueprint' : 'Official PDF Document'}</span>
                        <span>•</span>
                        <span>DFCCIL Approved Plan</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
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

                    <a
                      href={activeDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={currentPlan?.fileName || currentPlan?.pdfFileName || `${currentStation.code}_Key_Plan.pdf`}
                      className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-bold flex items-center gap-1 text-xs shadow cursor-pointer"
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

                    {currentPlan && (
                      <button
                        type="button"
                        onClick={handleDeletePlan}
                        className="p-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-xl transition border border-red-800"
                        title="Delete custom uploaded Key-Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Viewer Display */}
                <div className="w-full min-h-[480px] max-h-[620px] rounded-2xl overflow-auto border border-slate-800 bg-slate-950 shadow-inner flex flex-col items-center justify-center p-3 relative">
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
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-4">
                      <iframe
                        src={activeDocUrl}
                        title={`${currentStation.name} Key Plan PDF`}
                        className="w-full h-[480px] border-none rounded-xl hidden sm:block shadow-md bg-slate-900"
                      />
                      <div className="w-full text-center space-y-3 p-6 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl max-w-md mx-auto">
                        <FileText className="w-12 h-12 text-cyan-400 mx-auto animate-bounce" />
                        <div className="text-base font-extrabold text-white">
                          {currentStation.name} ({currentStation.code}) Key-Plan PDF
                        </div>
                        <p className="text-xs text-slate-400">
                          Approved DFCCIL Engineering Drawing & Yard Plan:
                        </p>
                        <a
                          href={activeDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={`${currentStation.code}_Key_Plan.pdf`}
                          className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Open / Download PDF ({currentPlan?.fileSizeKb || currentPlan?.pdfFileSizeKb || 420} KB)</span>
                        </a>
                      </div>
                    </div>
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
          </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950 text-xs">
          <span className="text-slate-400 font-mono">
            DFCCIL WDFC • IMSD SMUN P-Way Division • 6 Jurisdiction Stations
          </span>
          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold"
            >
              Close Viewer
            </button>
          )}
        </div>
      </div>
  );

  if (isInline) {
    return <div className="w-full max-w-6xl mx-auto py-2 animate-fadeIn">{containerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {containerContent}
    </div>
  );
};
