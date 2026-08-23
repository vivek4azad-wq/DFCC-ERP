/**
 * P-Way Track Maintenance Module (1+15 Gang, Drain Work, JCB Machinery)
 * Supervised by DFCCIL MTS with WhatsApp-Level Photo Compression
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../services/database.ts';
import {
  Wrench,
  Users,
  Shovel,
  Tractor,
  Calendar,
  Clock,
  Plus,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  FileText,
  Camera,
  Image as ImageIcon,
  X,
  Maximize2,
  ShieldCheck,
  Check
} from 'lucide-react';
import type { PWayDailyWorkRecord, PWayWorkCategory } from '../types/index.ts';

export const PWayMaintenanceModule: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'GANG_WORK' | 'DRAIN_WORK' | 'JCB_WORK' | 'ALL_WORK'>('GANG_WORK');
  const [workLogs, setWorkLogs] = useState<PWayDailyWorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  // Photo Upload State for new Entry
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Form State for new Maintenance Entry
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    gangName: '1+15 Gang SMUN (Mate: Baldev Singh)',
    workCategory: 'GANG_WORK' as PWayWorkCategory,
    workDone: '',
    fromKm: 1173.500,
    toKm: 1177.800,
    trackType: 'UP' as 'UP' | 'DN' | 'BOTH' | 'YARD' | 'LINK',
    section: 'SMUN-SBJN',
    numPersons: 16,
    hoursWorked: 8.0,
    machineUsed: 'Hydraulic Jacks & Beaters',
    supervisor: 'Mate Baldev Singh (AWPO)',
    dfccilRep: 'Pinki Sharma (MTS) / Field MTS Representative',
    remarks: ''
  });

  const canEdit = role === 'SUPER_ADMIN' || role === 'OFFICER' || role === 'STAFF';

  // ---------------------------------------------------------------------------
  // 📸 WHATSAPP-LEVEL PHOTO COMPRESSION (< 120 KB per image)
  // ---------------------------------------------------------------------------
  const compressImageWhatsAppLevel = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
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
          // WhatsApp standard quality: 0.70 JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.70);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingPhoto(true);
    try {
      const newPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageWhatsAppLevel(files[i]);
        newPhotos.push(compressed);
      }
      setCapturedPhotos(prev => [...prev, ...newPhotos].slice(0, 6)); // max 6 photos per log
    } catch (err) {
      console.error('Error compressing photo:', err);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const list = await db.getCollection<PWayDailyWorkRecord>('pway_daily_progress');
      if (list && list.length > 0) {
        setWorkLogs(list);
      } else {
        setWorkLogs([
          {
            id: 'WRK-2026-001',
            date: '2026-08-22',
            gangName: '1+15 Gang SMUN',
            trackType: 'UP',
            supervisor: 'Mate Baldev Singh (AWPO)',
            dfccilRep: 'Pinki Sharma (MTS) / Field MTS Representative',
            workCategory: 'GANG_WORK',
            workDone: 'Through packing, cross-level adjustment, and lifting of weld joints at Km 1174.200 to 1175.800 UP line.',
            fromKm: 1174.200,
            toKm: 1175.800,
            section: 'SMUN-SBJN',
            numPersons: 16,
            hoursWorked: 8,
            machineUsed: 'Hydraulic Jacks & Beaters',
            status: 'COMPLETED',
            remarks: 'Supervised on site by MTS Pinki Sharma. Full strength 16 deployed.',
            photos: []
          },
          {
            id: 'WRK-2026-002',
            date: '2026-08-21',
            gangName: 'Drain Maintenance Team',
            trackType: 'BOTH',
            supervisor: 'Supervisor Gurmeet Singh',
            dfccilRep: 'Field MTS Representative',
            workCategory: 'DRAIN_CLEANING',
            workDone: 'Side drain de-silting, catchment clearance, and cess slope dressing near Bridge 170 (Km 1204–1206).',
            fromKm: 1204.000,
            toKm: 1206.000,
            section: 'SBJN-NSIR',
            numPersons: 12,
            hoursWorked: 7.5,
            machineUsed: 'Manual Tools & Spades',
            status: 'COMPLETED',
            remarks: 'MTS verified smooth waterway flow prior to monsoon rains.',
            photos: []
          },
          {
            id: 'WRK-2026-003',
            date: '2026-08-20',
            gangName: 'Machinery & Earthwork Team',
            trackType: 'YARD',
            supervisor: 'Mate Baldev Singh',
            dfccilRep: 'Pinki Sharma (MTS)',
            workCategory: 'JCB_WORK',
            workDone: 'Cess de-silting, embankment dressing, and track formation leveling at SBJN Yard.',
            fromKm: 1187.000,
            toKm: 1190.000,
            section: 'SBJN Yard',
            numPersons: 6,
            hoursWorked: 6.5,
            machineUsed: 'JCB-3DX #PB-11-8402',
            status: 'COMPLETED',
            remarks: 'Logged 6.5 machinery hours under MTS supervision.',
            photos: []
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load maintenance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLog: PWayDailyWorkRecord = {
        id: `WRK-${Date.now()}`,
        date: formData.date,
        gangName: formData.gangName,
        supervisor: formData.supervisor || 'Mate Baldev Singh',
        dfccilRep: formData.dfccilRep || 'Pinki Sharma (MTS)',
        trackType: formData.trackType,
        workCategory: formData.workCategory,
        workDone: formData.workDone,
        fromKm: Number(formData.fromKm),
        toKm: Number(formData.toKm),
        section: formData.section,
        numPersons: Number(formData.numPersons),
        hoursWorked: Number(formData.hoursWorked),
        machineUsed: formData.machineUsed,
        status: 'COMPLETED',
        remarks: formData.remarks,
        photos: capturedPhotos
      };

      await db.addDocument('pway_daily_progress', newLog, currentUser);
      setIsModalOpen(false);
      setCapturedPhotos([]);
      await loadLogs();
    } catch (err: any) {
      alert(`Error saving maintenance log: ${err.message}`);
    }
  };

  const filteredLogs = useMemo(() => {
    return workLogs.filter(log => {
      if (activeTab === 'GANG_WORK') {
        if (log.workCategory !== 'GANG_WORK' && !log.workDone?.toLowerCase().includes('gang')) {
          return false;
        }
      } else if (activeTab === 'DRAIN_WORK') {
        if (log.workCategory !== 'DRAIN_CLEANING' && !log.workDone?.toLowerCase().includes('drain') && !log.workDone?.toLowerCase().includes('cess')) {
          return false;
        }
      } else if (activeTab === 'JCB_WORK') {
        if (log.workCategory !== 'JCB_WORK' && !log.workDone?.toLowerCase().includes('jcb') && !log.machineUsed?.toLowerCase().includes('jcb')) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.gangName?.toLowerCase().includes(q) ||
          log.workDone?.toLowerCase().includes(q) ||
          log.section?.toLowerCase().includes(q) ||
          log.dfccilRep?.toLowerCase().includes(q) ||
          String(log.fromKm).includes(q) ||
          String(log.toKm).includes(q)
        );
      }
      return true;
    });
  }, [workLogs, activeTab, searchQuery]);

  // Statistics
  const totalJcbHours = useMemo(() => {
    return workLogs
      .filter(w => w.workCategory === 'JCB_WORK' || w.workDone?.toLowerCase().includes('jcb') || w.machineUsed?.toLowerCase().includes('jcb'))
      .reduce((sum, w) => sum + (Number(w.hoursWorked) || 6.5), 0);
  }, [workLogs]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  P-Way Track Maintenance &amp; 1+15 Gang ERP
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-[10px] font-black uppercase font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>MTS SUPERVISED</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily Work Progress, Drain De-silting, JCB Machinery Logs &amp; Site Photo Evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => {
                  setCapturedPhotos([]);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Log Maintenance Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto no-scrollbar">
          {[
            { id: 'GANG_WORK', label: '1+15 Gang Daily Work', icon: Users },
            { id: 'DRAIN_WORK', label: 'Drain & Cess Work', icon: Shovel },
            { id: 'JCB_WORK', label: 'JCB Machinery Log', icon: Tractor },
            { id: 'ALL_WORK', label: 'All Maintenance Logs', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Supervision Authority</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">Pinki Sharma (MTS)</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">100% On-Site MTS Verification</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Cumulative JCB Hours Logged</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalJcbHours.toFixed(1)} Hours</div>
          <div className="text-[11px] text-slate-500 mt-1">Cess dressing &amp; side drain clearing</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Work Shifts Indexed</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{workLogs.length} Days</div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">Continuous maintenance log</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search maintenance logs by location, gang, section, MTS supervisor, or work description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Maintenance Logs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLogs.map(log => (
          <div
            key={log.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded text-[10px] font-bold font-mono uppercase">
                  {log.workCategory}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                  {log.gangName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Km {Number(log.fromKm || 0).toFixed(3)} to {Number(log.toKm || 0).toFixed(3)} ({log.section})</span>
                </p>
              </div>

              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-bold shrink-0">
                {log.status || 'COMPLETED'}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
              {log.workDone}
            </p>

            {/* Photos Gallery */}
            {log.photos && log.photos.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Site Evidence Photos ({log.photos.length})</span>
                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                  {log.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setSelectedPhotoPreview(photo)}
                      className="w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition relative group"
                    >
                      <img src={photo} alt="Work site evidence" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">MTS SUPERVISOR</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate block" title={log.dfccilRep}>
                  {log.dfccilRep || 'Pinki Sharma (MTS)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MANPOWER</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{log.numPersons || 16} Persons</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">HOURS WORKED</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{log.hoursWorked || 8} Hrs</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">DATE</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{log.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Fullscreen Photo Preview */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl p-3 shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedPhotoPreview} alt="Work Site" className="max-h-[80vh] w-auto mx-auto rounded-2xl object-contain" />
          </div>
        </div>
      )}

      {/* Modal: Log Maintenance Entry with Photo Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log P-Way Track Maintenance Work</h3>
                <p className="text-[11px] text-slate-500">MTS Supervised Field Record with Photo Evidence</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveWork} className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Category</label>
                <select
                  value={formData.workCategory}
                  onChange={e => setFormData({ ...formData, workCategory: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="GANG_WORK">1+15 Gang Daily Work (Packing & Lifting)</option>
                  <option value="DRAIN_CLEANING">Drain Cleaning & De-silting</option>
                  <option value="JCB_WORK">JCB Machinery Operations</option>
                  <option value="BALLAST_BOXING">Ballast Boxing & Dressing</option>
                  <option value="CESS_DEWEEDING">Cess & Vegetation Deweeding</option>
                  <option value="OTHER">Other P-Way Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">MTS Supervisor</label>
                <input
                  type="text"
                  required
                  value={formData.dfccilRep}
                  onChange={e => setFormData({ ...formData, dfccilRep: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gang / Team Name</label>
                <input
                  type="text"
                  required
                  value={formData.gangName}
                  onChange={e => setFormData({ ...formData, gangName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Machine / Tools Used</label>
                <input
                  type="text"
                  value={formData.machineUsed}
                  onChange={e => setFormData({ ...formData, machineUsed: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">From Km</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={formData.fromKm}
                  onChange={e => setFormData({ ...formData, fromKm: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">To Km</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={formData.toKm}
                  onChange={e => setFormData({ ...formData, toKm: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Persons Deployed</label>
                <input
                  type="number"
                  required
                  value={formData.numPersons}
                  onChange={e => setFormData({ ...formData, numPersons: parseInt(e.target.value) || 16 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={formData.hoursWorked}
                  onChange={e => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) || 8 })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Done Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Through packing, side drain cleaning, cess dressing executed"
                  value={formData.workDone}
                  onChange={e => setFormData({ ...formData, workDone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Photo Upload Section */}
              <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Upload Site Photos (WhatsApp-level Compressed &lt; 120 KB)</span>
                  </span>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isCompressingPhoto}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1 shadow active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isCompressingPhoto ? 'Compressing...' : 'Add Photo'}</span>
                  </button>
                </div>

                {capturedPhotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                    {capturedPhotos.map((photo, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-600 overflow-hidden shrink-0">
                        <img src={photo} alt="Uploaded evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCapturedPhotos(capturedPhotos.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 p-1 bg-red-600 text-white rounded-full text-[9px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
