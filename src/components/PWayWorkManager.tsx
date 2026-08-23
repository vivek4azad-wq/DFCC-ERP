/**
 * P-Way Track Works, 1+15 Gang Daily Progress, Drain Cleaning/Tamping Ledger, JCB Work, Week-Wise Program & Schedule Inspection ERP
 * DFCCIL IMSD SMUN Unit (Civil / P-Way)
 * 
 * Mandated Gang Norm: 16 Persons (1 Mate/Supervisor + 15 Track Maintainers)
 * 
 * Features:
 * 1. 🏗️ Gang Daily Work Progress (with automatic Manpower Shortage detection & high-contrast highlights)
 * 2. 🌊 Drain Cleaning & Tamping Ledger (Date, Km Pole, Total Km, MTS Representative Dropdown) with Total Km SUM
 * 3. 🚜 JCB Machinery & Cess Work Register (Date, Location, Nature of Work, Hours Worked) with Total Hours SUM
 * 4. 📅 Week-Wise Program (Target vs Actual across Weeks 1, 2, 3, 4/5 of Month)
 * 5. 🔍 Schedule Inspection Register (Push trolley, curves, P&C, bridges, night foot patrol)
 * 6. ➕ Dynamic Gang Work Dropdown with Custom Input that saves directly to Firebase
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/database.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  HardHat,
  Calendar,
  Layers,
  Search,
  Filter,
  Download,
  Printer,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Truck,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  UserCheck,
  ShieldCheck,
  Phone,
  MessageSquare,
  Sparkles,
  MapPin,
  Check,
  X,
  Eye,
  Activity,
  Sliders,
  AlertCircle,
  Users,
  UserX,
  TrendingDown,
  Droplet,
  Settings
} from 'lucide-react';
import type {
  PWayDailyWorkRecord,
  PWayMonthlyProgramRecord,
  PWayScheduleInspectionRecord,
  PWayWorkCategory,
  PWayInspectionType,
  OfficerStaffRecord,
  GangWorkTypeRecord
} from '../types/index.ts';

const SANCTIONED_GANG_STRENGTH = 16; // Mandated: 1 Mate + 15 Track Maintainers = 16 Persons

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SECTIONS = [
  { id: 'KRJN-SMUN', name: 'KRJN–SMUN (Km 1167.210 – 1170.435)', minKm: 1167.210, maxKm: 1170.435 },
  { id: 'SMUN-SBJN', name: 'SMUN–SBJN (Km 1170.435 – 1188.575)', minKm: 1170.435, maxKm: 1188.575 },
  { id: 'SBJN-NSIR', name: 'SBJN–NSIR (Km 1188.575 – 1202.015)', minKm: 1188.575, maxKm: 1202.015 },
  { id: 'NSIR-GVGN', name: 'NSIR–GVGN (Km 1202.015 – 1213.187)', minKm: 1202.015, maxKm: 1213.187 },
  { id: 'GVGN-KNNN', name: 'GVGN–KNNN (Km 1213.187 – 1229.087)', minKm: 1213.187, maxKm: 1229.087 },
  { id: 'KNNN-CHAN', name: 'KNNN–CHAN (Km 1229.087 – 1235.837)', minKm: 1229.087, maxKm: 1235.837 },
  { id: 'CHAN-SNL', name: 'CHAN–SNL (Km 1235.837 – 1249.720)', minKm: 1235.837, maxKm: 1249.720 },
  { id: 'RPJ-LINK', name: 'Rajpura Link Line (Km 0.000 – 6.169)', minKm: 0.000, maxKm: 6.169 }
];

const WORK_CATEGORIES_CONFIG: {
  key: PWayWorkCategory | 'ALL';
  label: string;
  shortLabel: string;
  icon: string;
  colorClass: string;
  description: string;
}[] = [
  {
    key: 'ALL',
    label: 'All Works Consolidated',
    shortLabel: 'All Works',
    icon: '📊',
    colorClass: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Consolidated master register of all P-Way track activities'
  },
  {
    key: 'GANG_WORK',
    label: 'Gang Work (1+15 Persons)',
    shortLabel: 'Gang Work',
    icon: '🏗️',
    colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Through packing, shallow screening, lifting, lining, gauge adjustment & sleeper maintenance'
  },
  {
    key: 'DRAIN_CLEANING',
    label: 'Drain Cleaning Work',
    shortLabel: 'Drain Cleaning',
    icon: '🌊',
    colorClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    description: 'Catch-water drains, pucca/kutchha side drains, culvert opening & de-silting'
  },
  {
    key: 'JCB_WORK',
    label: 'JCB Work & Cess Repair',
    shortLabel: 'JCB Work',
    icon: '🚜',
    colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Embankment slope dressing (Km 1173.5–1177.8), cess widening, boulder moving & heavy earthwork'
  },
  {
    key: 'CESS_DEWEEDING',
    label: 'Cess Deweeding Work',
    shortLabel: 'Cess Deweeding',
    icon: '🌿',
    colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Chemical & manual grass cutting, wild vegetation clearing along cess'
  },
  {
    key: 'BALLAST_BOXING',
    label: 'Boxing of Ballast',
    shortLabel: 'Ballast Boxing',
    icon: '🪨',
    colorClass: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Ballast profiling, crib filling, shoulder ballast dressing & regulation'
  },
  {
    key: 'PRE_POST_TAMPING',
    label: 'Pre & Post Tamping Work',
    shortLabel: 'Pre/Post Tamping',
    icon: '🚂',
    colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Pre-tamping survey & tightening, post-tamping cross-level & versine verification'
  }
];

export const PWayWorkManager: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isMtsUser = role === 'STAFF' || currentUser?.designation === 'MTS' || (currentUser?.post && currentUser.post.includes('MTS'));
  const isPrivilegedAuditor = isSuperAdmin || (currentUser?.name && currentUser.name.toLowerCase().includes('arjun')) || role === 'OFFICER';

  // Navigation State
  const [mainView, setMainView] = useState<'daily_progress' | 'drain_tamping' | 'jcb_work' | 'shortage_register' | 'weekly_program' | 'inspections'>('daily_progress');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<PWayWorkCategory | 'ALL'>('ALL');

  // Month, Year & Week State for Program & Inspection
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Collections
  const [dailyProgressList, setDailyProgressList] = useState<PWayDailyWorkRecord[]>([]);
  const [monthlyProgramList, setMonthlyProgramList] = useState<PWayMonthlyProgramRecord[]>([]);
  const [inspectionsList, setInspectionsList] = useState<PWayScheduleInspectionRecord[]>([]);
  const [outsourceStaffList, setOutsourceStaffList] = useState<OfficerStaffRecord[]>([]);
  const [gangWorkTypesList, setGangWorkTypesList] = useState<GangWorkTypeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Dynamic Custom Gang Work State
  const [isAddingCustomWorkType, setIsAddingCustomWorkType] = useState(false);
  const [customWorkTypeTitle, setCustomWorkTypeTitle] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState<string>('ALL');
  const [manpowerFilter, setManpowerFilter] = useState<'ALL' | 'SHORTAGE_ONLY' | 'FULL_STRENGTH'>('ALL');

  // Photo Lightbox & Compression State (MTS Photo Upload)
  const [selectedPhotoForModal, setSelectedPhotoForModal] = useState<{
    url: string;
    title: string;
    uploader: string;
    date: string;
    km: string;
  } | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // WhatsApp-level Client Side Image Compression Helper (~100-200 KB)
  const compressImageWhatsAppLevel = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200; // WhatsApp standard resolution
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(e.target?.result as string);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Modals
  const [isAddProgressModalOpen, setIsAddProgressModalOpen] = useState(false);
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [progressFormData, setProgressFormData] = useState<Partial<PWayDailyWorkRecord>>({
    date: new Date().toISOString().split('T')[0],
    gangName: 'Gang No. 1 (1+15)',
    numPersons: 16,
    fromKm: 1172.500,
    toKm: 1175.000,
    trackType: 'UP',
    section: 'SMUN-SBJN',
    workCategory: 'GANG_WORK',
    workCategoryTitle: 'Gang Work (Track Maintenance)',
    workDone: '',
    quantityOrLength: '2.500 Km',
    hoursWorked: 8.0,
    machineNo: 'JCB-3DX-PB65',
    supervisor: 'Gurpreet Singh (Mate / 9876543210)',
    dfccilRep: 'Pinki Sharma (MTS / 9592751503)',
    status: 'COMPLETED',
    remarks: '',
    photos: []
  });

  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programFormData, setProgramFormData] = useState<Partial<PWayMonthlyProgramRecord>>({
    month: selectedMonth,
    year: selectedYear,
    workCategory: 'GANG_WORK',
    categoryTitle: 'Gang Work (Track Maintenance)',
    section: 'SMUN-SBJN (Km 1170.435 - 1188.575)',
    targetKmFrom: 1170.435,
    targetKmTo: 1188.575,
    targetQuantity: 18.140,
    targetUnit: 'Km',
    actualProgressQuantity: 0,
    achievedPercentage: 0,
    assignedAgency: 'Contractor Gang (1+15 Persons)',
    supervisorIncharge: 'Gurpreet Singh (Mate)',
    dfccilIncharge: 'Vivek Kumar Azad (APM / Civil)',
    status: 'IN_PROGRESS',
    remarks: ''
  });

  const [isAddInspectionModalOpen, setIsAddInspectionModalOpen] = useState(false);
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
  const [inspectionFormData, setInspectionFormData] = useState<Partial<PWayScheduleInspectionRecord>>({
    inspectionType: 'PUSH_TROLLEY',
    inspectionTypeName: 'Push Trolley / Motor Trolley Inspection',
    inspectingOfficial: 'Vivek Kumar Azad (APM / Civil)',
    scheduleFrequency: 'FORTNIGHTLY',
    targetMonth: selectedMonth,
    targetYear: selectedYear,
    targetDate: new Date().toISOString().split('T')[0],
    inspectionDate: new Date().toISOString().split('T')[0],
    section: 'SMUN-SBJN',
    fromKm: 1170.435,
    toKm: 1188.575,
    complianceStatus: 'COMPLETED',
    deficienciesNoted: '',
    actionTaken: '',
    remarks: ''
  });

  // Load Master Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [progress, programs, inspections, officers, customWorkTypes] = await Promise.all([
        db.getCollection<PWayDailyWorkRecord>('pway_daily_progress'),
        db.getCollection<PWayMonthlyProgramRecord>('pway_monthly_program'),
        db.getCollection<PWayScheduleInspectionRecord>('pway_inspections'),
        db.getCollection<OfficerStaffRecord>('officers_staff'),
        db.getCollection<GangWorkTypeRecord>('gang_work_types')
      ]);

      setDailyProgressList(progress || []);
      setMonthlyProgramList(programs || []);
      setInspectionsList(inspections || []);
      setOutsourceStaffList(officers || []);
      setGangWorkTypesList(customWorkTypes || []);
    } catch (err) {
      console.error('Failed to load P-Way data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  // Handle Save Custom Gang Work Type directly to Firebase
  const handleSaveCustomWorkType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWorkTypeTitle.trim()) return;

    const newType: GangWorkTypeRecord = {
      id: `GWT-${Date.now().toString().slice(-6)}`,
      title: customWorkTypeTitle.trim(),
      category: 'CUSTOM_GANG_WORK',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'DFCCIL Staff'
    };

    await db.addDocument('gang_work_types', newType, currentUser);
    setGangWorkTypesList(prev => [...prev, newType]);
    setProgressFormData(prev => ({
      ...prev,
      workCategoryTitle: newType.title,
      workDone: newType.title
    }));
    setCustomWorkTypeTitle('');
    setIsAddingCustomWorkType(false);
    setSaveSuccessMsg(`Custom Gang Work "${newType.title}" saved to Firebase!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Filtered Daily Progress List
  const filteredDailyProgress = useMemo(() => {
    return dailyProgressList.filter(item => {
      if (isMtsUser && !isPrivilegedAuditor && item.date !== todayStr) {
        return false;
      }
      if (selectedCategoryTab !== 'ALL' && item.workCategory !== selectedCategoryTab) {
        return false;
      }
      if (selectedSectionFilter !== 'ALL' && item.section !== selectedSectionFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL' && item.status !== selectedStatusFilter) {
        return false;
      }
      if (manpowerFilter === 'SHORTAGE_ONLY' && item.numPersons >= SANCTIONED_GANG_STRENGTH) {
        return false;
      }
      if (manpowerFilter === 'FULL_STRENGTH' && item.numPersons < SANCTIONED_GANG_STRENGTH) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.workDone.toLowerCase().includes(q) ||
          item.supervisor.toLowerCase().includes(q) ||
          item.dfccilRep.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          (item.remarks || '').toLowerCase().includes(q) ||
          item.date.includes(q)
        );
      }
      return true;
    });
  }, [dailyProgressList, selectedCategoryTab, selectedSectionFilter, selectedStatusFilter, manpowerFilter, searchQuery]);

  // Drain Cleaning & Tamping Items
  const drainTampingList = useMemo(() => {
    return dailyProgressList.filter(item => item.workCategory === 'DRAIN_CLEANING' || item.workCategory === 'PRE_POST_TAMPING');
  }, [dailyProgressList]);

  // Total Drain Cleaning & Tamping Length SUM in Km
  const totalDrainTampingKmSum = useMemo(() => {
    return drainTampingList.reduce((acc, curr) => acc + Math.abs(Number(curr.toKm) - Number(curr.fromKm)), 0);
  }, [drainTampingList]);

  // JCB Machinery Work Items
  const jcbWorkList = useMemo(() => {
    return dailyProgressList.filter(item => item.workCategory === 'JCB_WORK' || (item.workDone && item.workDone.toLowerCase().includes('jcb')));
  }, [dailyProgressList]);

  // Total JCB Hours Worked SUM
  const totalJcbHoursSum = useMemo(() => {
    return jcbWorkList.reduce((acc, curr) => acc + (Number(curr.hoursWorked) || 6.5), 0);
  }, [jcbWorkList]);

  // Shortage Records
  const shortageRecordsList = useMemo(() => {
    return dailyProgressList
      .filter(item => item.numPersons < SANCTIONED_GANG_STRENGTH)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dailyProgressList]);

  // Week-Wise Programs (Mapped from Monthly Programs for current week)
  const weekWisePrograms = useMemo(() => {
    const monthProgs = monthlyProgramList.filter(p => p.month === selectedMonth && p.year === selectedYear);
    return monthProgs.map((p, idx) => {
      const weeklyTarget = (p.targetQuantity / 4).toFixed(3);
      const weeklyActual = (p.actualProgressQuantity / (5 - selectedWeek)).toFixed(3);
      const weeklyPct = Math.min(100, Math.round((Number(weeklyActual) / Math.max(0.1, Number(weeklyTarget))) * 100));
      return {
        ...p,
        weekNumber: selectedWeek,
        weeklyTarget: Number(weeklyTarget),
        weeklyActual: Number(weeklyActual),
        weeklyPct
      };
    });
  }, [monthlyProgramList, selectedMonth, selectedYear, selectedWeek]);

  // KPI Metrics Calculation
  const kpiMetrics = useMemo(() => {
    const totalDailyLogs = dailyProgressList.length;
    const completedDaily = dailyProgressList.filter(d => d.status === 'COMPLETED').length;
    const totalKmCovered = dailyProgressList.reduce((acc, curr) => acc + Math.abs(curr.toKm - curr.fromKm), 0);
    const shortageDaysCount = shortageRecordsList.length;
    const totalManDaysDeficit = shortageRecordsList.reduce((acc, curr) => acc + (SANCTIONED_GANG_STRENGTH - curr.numPersons), 0);
    const totalInspections = inspectionsList.length;
    const completedInspections = inspectionsList.filter(i => i.complianceStatus === 'COMPLETED').length;

    return {
      totalDailyLogs,
      completedDaily,
      totalKmCovered: totalKmCovered.toFixed(2),
      shortageDaysCount,
      totalManDaysDeficit,
      totalInspections,
      completedInspections
    };
  }, [dailyProgressList, shortageRecordsList, inspectionsList]);

  // Save / Update Daily Work Progress
  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: PWayDailyWorkRecord = {
        id: editingProgressId || `PWAY-${Date.now().toString().slice(-6)}`,
        date: progressFormData.date || todayStr,
        gangName: progressFormData.gangName || 'Gang No. 1 (1+15)',
        numPersons: Number(progressFormData.numPersons || 16),
        fromKm: Number(progressFormData.fromKm || 1172.500),
        toKm: Number(progressFormData.toKm || 1175.000),
        trackType: progressFormData.trackType || 'UP',
        section: progressFormData.section || 'SMUN-SBJN',
        workCategory: progressFormData.workCategory || 'GANG_WORK',
        workCategoryTitle: progressFormData.workCategoryTitle || 'Gang Work',
        workDone: progressFormData.workDone || '',
        quantityOrLength: progressFormData.quantityOrLength || '1.500 Km',
        hoursWorked: Number(progressFormData.hoursWorked || 8.0),
        machineNo: progressFormData.machineNo || 'JCB-3DX-PB65',
        supervisor: progressFormData.supervisor || 'Gurpreet Singh (Mate)',
        dfccilRep: progressFormData.dfccilRep || 'Pinki Sharma (MTS)',
        status: progressFormData.status || 'COMPLETED',
        remarks: progressFormData.remarks || '',
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.name || 'DFCCIL Personnel'
      };

      if (editingProgressId) {
        await db.updateDocument('pway_daily_progress', editingProgressId, payload, currentUser);
      } else {
        await db.addDocument('pway_daily_progress', payload, currentUser);
      }

      setIsAddProgressModalOpen(false);
      setEditingProgressId(null);
      setSaveSuccessMsg('Daily work progress log saved successfully to Cloud Firestore.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Error saving progress: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 print-container text-slate-900 dark:text-slate-100">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-[#123b72] dark:text-cyan-400 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">P-Way Track Maintenance &amp; Gang ERP</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                Field Progress &amp; Machinery
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              DFCCIL IMSD SMUN · Daily Work Progress, Drain Cleaning &amp; Tamping SUM, JCB Hours, Week-Wise Program &amp; Schedule Inspections
            </p>
          </div>
        </div>

        {/* Top View Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setMainView('daily_progress')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              mainView === 'daily_progress'
                ? 'bg-[#123b72] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>1+15 Gang Progress</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('drain_tamping')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              mainView === 'drain_tamping'
                ? 'bg-cyan-600 text-white shadow-sm font-black'
                : 'text-cyan-800 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/60'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>🌊 Drain &amp; Tamping (SUM: {totalDrainTampingKmSum.toFixed(2)} Km)</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('jcb_work')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              mainView === 'jcb_work'
                ? 'bg-amber-600 text-white shadow-sm font-black'
                : 'text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>🚜 JCB Work (SUM: {totalJcbHoursSum.toFixed(1)} Hrs)</span>
          </button>

          {/* Saved for later entry: Week-Wise Program & Inspections
          <button
            type="button"
            onClick={() => setMainView('weekly_program')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              mainView === 'weekly_program'
                ? 'bg-[#123b72] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📅 Week-Wise Program</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('inspections')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              mainView === 'inspections'
                ? 'bg-[#123b72] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🔍 Inspections</span>
          </button>
          */}

          <button
            type="button"
            onClick={() => setMainView('shortage_register')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              mainView === 'shortage_register'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>⚠️ Shortages ({kpiMetrics.shortageDaysCount})</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-blue-700 dark:text-cyan-400 font-bold block uppercase">Track Span Covered</span>
          <span className="text-xl font-black text-[#123b72] dark:text-white font-mono">{kpiMetrics.totalKmCovered} Km</span>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{kpiMetrics.totalDailyLogs} Progress logs recorded</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-800 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold block uppercase">Drain Cleaning / Tamping SUM</span>
          <span className="text-xl font-black text-cyan-800 dark:text-cyan-300 font-mono">{totalDrainTampingKmSum.toFixed(3)} Km</span>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{drainTampingList.length} Drains &amp; Tamping logs</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block uppercase">JCB Machinery Hours SUM</span>
          <span className="text-xl font-black text-amber-800 dark:text-amber-300 font-mono">{totalJcbHoursSum.toFixed(1)} Hours</span>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">{jcbWorkList.length} Machinery work logs</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">Gang Norm Requirement</span>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">16 Men (1+15)</span>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">1 Mate + 15 Track Maintainers</div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
          VIEW 1: DRAIN CLEANING & TAMPING LEDGER (with Total Km SUM)
      ---------------------------------------------------------------------- */}
      {mainView === 'drain_tamping' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-cyan-950 dark:text-cyan-200">
                  🌊 Drain Cleaning &amp; Pre/Post Tamping Work Ledger
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-200 text-cyan-900 font-mono">
                  {drainTampingList.length} Entries
                </span>
              </div>
              <p className="text-xs text-cyan-800 dark:text-cyan-300">
                Catch-water drains, side drain de-silting, culvert opening, pre-tamping surveys &amp; post-tamping versine verification.
              </p>
            </div>

            {/* Total SUM Card */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-cyan-300 dark:border-cyan-700 shadow-sm shrink-0 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Total Drain/Tamping SUM</div>
              <div className="text-xl font-black font-mono text-cyan-950 dark:text-white">
                {totalDrainTampingKmSum.toFixed(3)} Km
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Cumulative Span Cleaned &amp; Tamped</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Km Pole (From – To)</th>
                    <th className="p-3">Total Km (Length)</th>
                    <th className="p-3">Track / Section</th>
                    <th className="p-3 min-w-[200px]">Work Description</th>
                    <th className="p-3">Representative of MTS Staff</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {drainTampingList.map((item, idx) => {
                    const spanKm = Math.abs(Number(item.toKm) - Number(item.fromKm)).toFixed(3);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-sans">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{item.date}</td>
                        <td className="p-3 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                          Km {Number(item.fromKm).toFixed(3)} – {Number(item.toKm).toFixed(3)}
                        </td>
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                          {spanKm} Km
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                          {item.section} ({item.trackType})
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-slate-900 dark:text-slate-100 text-xs">{item.workDone}</p>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 mt-1 inline-block">
                            {item.workCategoryTitle || item.workCategory}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-1 bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg font-bold text-xs">
                            👤 {item.dfccilRep || 'Pinki Sharma (MTS)'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] italic">
                          {item.remarks || '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Table Footer with Total SUM */}
                  <tr className="bg-cyan-50/80 dark:bg-cyan-950/60 font-bold border-t-2 border-cyan-300 dark:border-cyan-700 text-cyan-950 dark:text-cyan-100">
                    <td colSpan={3} className="p-3 text-right font-black uppercase text-xs">
                      TOTAL DRAIN CLEANING &amp; TAMPING SUM:
                    </td>
                    <td className="p-3 font-mono font-black text-sm text-cyan-900 dark:text-cyan-300">
                      {totalDrainTampingKmSum.toFixed(3)} Km
                    </td>
                    <td colSpan={5} className="p-3 text-xs text-slate-600 dark:text-slate-400">
                      Cumulative aggregate length of drains cleaned, culverts opened &amp; track tamped
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          VIEW 2: JCB WORK & MACHINERY REGISTER (with Total Hours SUM)
      ---------------------------------------------------------------------- */}
      {mainView === 'jcb_work' && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-amber-950 dark:text-amber-200">
                  🚜 JCB Machinery &amp; Earthwork Register
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
                  {jcbWorkList.length} Entries
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                High Embankment slope dressing (Km 1173.5–1177.8), cess widening, boulder clearing, and heavy machinery excavation logs.
              </p>
            </div>

            {/* Total Hours SUM Card */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700 shadow-sm shrink-0 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Total JCB Hours SUM</div>
              <div className="text-xl font-black font-mono text-amber-950 dark:text-white">
                {totalJcbHoursSum.toFixed(1)} Hours
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Cumulative Machine Hours</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Location / Km Pole</th>
                    <th className="p-3">Nature of JCB Work</th>
                    <th className="p-3">Hours Worked</th>
                    <th className="p-3">Machine No. / Vendor</th>
                    <th className="p-3">Supervisor In-Charge</th>
                    <th className="p-3">DFCCIL Rep</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {jcbWorkList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-sans">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{item.date}</td>
                      <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                        Km {Number(item.fromKm).toFixed(3)} – {Number(item.toKm).toFixed(3)} ({item.section})
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.workDone}</p>
                      </td>
                      <td className="p-3 font-mono font-black text-amber-800 dark:text-amber-300 text-sm">
                        {Number(item.hoursWorked || 6.5).toFixed(1)} Hrs
                      </td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                        {item.machineNo || 'JCB-3DX-PB65'}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        {item.supervisor}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-300 border border-purple-200 rounded font-semibold text-[11px]">
                          {item.dfccilRep || 'Pinki Sharma (MTS)'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] italic">
                        {item.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Table Footer with Total SUM */}
                  <tr className="bg-amber-50/80 dark:bg-amber-950/60 font-bold border-t-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100">
                    <td colSpan={4} className="p-3 text-right font-black uppercase text-xs">
                      TOTAL JCB WORK HOURS SUM:
                    </td>
                    <td className="p-3 font-mono font-black text-sm text-amber-900 dark:text-amber-300">
                      {totalJcbHoursSum.toFixed(1)} Hours
                    </td>
                    <td colSpan={4} className="p-3 text-xs text-slate-600 dark:text-slate-400">
                      Cumulative aggregate machinery working hours verified on site
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          VIEW 3: WEEK-WISE TRACK MAINTENANCE PROGRAM
      ---------------------------------------------------------------------- */}
      {mainView === 'weekly_program' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Week Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { num: 1, label: 'Week 1 (01–07)', dates: '01 to 07' },
                { num: 2, label: 'Week 2 (08–14)', dates: '08 to 14' },
                { num: 3, label: 'Week 3 (15–21)', dates: '15 to 21' },
                { num: 4, label: 'Week 4 & 5 (22–End)', dates: '22 to End' }
              ].map(w => (
                <button
                  key={w.num}
                  type="button"
                  onClick={() => setSelectedWeek(w.num as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedWeek === w.num
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <div>{w.label}</div>
                  <div className="text-[9px] font-mono opacity-80">{w.dates} {MONTH_NAMES[selectedMonth].slice(0, 3)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Week Program Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekWisePrograms.map(item => {
              const catObj = WORK_CATEGORIES_CONFIG.find(c => c.key === item.workCategory);
              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catObj?.colorClass || 'bg-slate-100'}`}>
                        {catObj?.icon} {catObj?.shortLabel || item.workCategory}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 font-mono">
                        Week {selectedWeek} Target
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.categoryTitle}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{item.section}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Weekly Target vs Actual:</span>
                        <span className="text-blue-900 dark:text-cyan-300 font-mono">
                          {item.weeklyActual} / {item.weeklyTarget} {item.targetUnit} ({item.weeklyPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            item.weeklyPct >= 100 ? 'bg-emerald-600' : 'bg-[#123b72]'
                          }`}
                          style={{ width: `${Math.min(100, item.weeklyPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gang Agency:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.assignedAgency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DFCCIL Incharge:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.dfccilIncharge}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          VIEW 4: DAILY PROGRESS (Master 1+15 Gang Register)
      ---------------------------------------------------------------------- */}
      {mainView === 'daily_progress' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search daily work logs by description, supervisor, MTS representative, section..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setEditingProgressId(null);
                  setProgressFormData({
                    date: new Date().toISOString().split('T')[0],
                    gangName: 'Gang No. 1 (1+15)',
                    numPersons: 16,
                    fromKm: 1172.500,
                    toKm: 1175.000,
                    trackType: 'UP',
                    section: 'SMUN-SBJN',
                    workCategory: 'GANG_WORK',
                    workCategoryTitle: 'Gang Work (Track Maintenance)',
                    workDone: '',
                    quantityOrLength: '1.500 Km',
                    hoursWorked: 8.0,
                    machineNo: 'JCB-3DX-PB65',
                    supervisor: 'Gurpreet Singh (Mate / 9876543210)',
                    dfccilRep: 'Pinki Sharma (MTS / 9592751503)',
                    status: 'COMPLETED',
                    remarks: ''
                  });
                  setIsAddProgressModalOpen(true);
                }}
                className="px-4 py-2 bg-[#123b72] hover:bg-[#1a4f9c] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Daily Work Progress</span>
              </button>
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Manpower (1+15 Norm)</th>
                    <th className="p-3">KM From – To</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 min-w-[180px]">Work Done</th>
                    <th className="p-3">Output</th>
                    <th className="p-3">Supervisor (Mate)</th>
                    <th className="p-3">DFCCIL Rep (MTS)</th>
                    <th className="p-3">Photo (MTS)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredDailyProgress.map((item, idx) => {
                    const lengthKm = Math.abs(item.toKm - item.fromKm).toFixed(3);
                    const isShortage = item.numPersons < SANCTIONED_GANG_STRENGTH;
                    const photoSrc = item.photoUrl || (item.photos && item.photos.length > 0 ? item.photos[0] : null);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{item.date}</td>
                        <td className="p-3 whitespace-nowrap">
                          {isShortage ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 border border-red-300 rounded-xl font-mono font-black text-xs">
                              ⚠️ {item.numPersons} / {SANCTIONED_GANG_STRENGTH} (Short: {SANCTIONED_GANG_STRENGTH - item.numPersons})
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-mono font-bold text-xs">
                              👥 {item.numPersons} (Full 1+15)
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                          Km {item.fromKm.toFixed(3)} – {item.toKm.toFixed(3)} ({lengthKm} Km)
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{item.section}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                            {item.workCategoryTitle || item.workCategory}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-slate-900 dark:text-white text-xs">{item.workDone}</p>
                        </td>
                        <td className="p-3 font-mono font-semibold">{item.quantityOrLength}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{item.supervisor}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200 rounded font-semibold text-[11px]">
                            {item.dfccilRep || 'Pinki Sharma (MTS)'}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {photoSrc ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPhotoForModal({
                                  url: photoSrc,
                                  title: item.workCategoryTitle || item.workCategory,
                                  uploader: item.dfccilRep || 'MTS Representative',
                                  date: item.date,
                                  km: `Km ${item.fromKm.toFixed(3)} – ${item.toKm.toFixed(3)} (${item.section})`
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-2 py-1 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900 border border-cyan-300 dark:border-cyan-800 rounded-xl text-cyan-800 dark:text-cyan-300 font-bold text-[11px] transition shadow-sm active:scale-95"
                              title="Click to view full size photo uploaded by MTS"
                            >
                              <img
                                src={photoSrc}
                                alt="MTS Progress"
                                className="w-5 h-5 rounded-md object-cover border border-cyan-400 shrink-0"
                              />
                              <span>📸 Photo</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setEditingProgressId(item.id);
                              setProgressFormData(item);
                              setIsAddProgressModalOpen(true);
                            }}
                            className="p-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          MODAL: ADD / EDIT DAILY WORK PROGRESS WITH DYNAMIC GANG WORK DROPDOWN
      ---------------------------------------------------------------------- */}
      {isAddProgressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProgressId ? 'Edit Work Progress Log' : 'Record P-Way Daily Work Progress'}
              </h3>
              <button onClick={() => setIsAddProgressModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={progressFormData.date}
                    onChange={e => setProgressFormData({ ...progressFormData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Gang Name</label>
                  <input
                    type="text"
                    required
                    value={progressFormData.gangName}
                    onChange={e => setProgressFormData({ ...progressFormData, gangName: e.target.value })}
                    placeholder="e.g. Gang No. 1 (1+15)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    No. of Persons Deployed
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={progressFormData.numPersons}
                    onChange={e => setProgressFormData({ ...progressFormData, numPersons: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Gang Work Category & Custom Type Creator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold">
                    Gang Work Activity / Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomWorkType(!isAddingCustomWorkType)}
                    className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                  >
                    {isAddingCustomWorkType ? '✕ Cancel' : '+ Add Custom Gang Work Type'}
                  </button>
                </div>

                {isAddingCustomWorkType ? (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Enter custom gang work title (e.g. Ballast regulation, joint greasing)..."
                      value={customWorkTypeTitle}
                      onChange={e => setCustomWorkTypeTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomWorkType}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm whitespace-nowrap"
                    >
                      Save to Firebase
                    </button>
                  </div>
                ) : (
                  <select
                    value={progressFormData.workCategoryTitle || progressFormData.workCategory}
                    onChange={e => {
                      const val = e.target.value;
                      const matched = WORK_CATEGORIES_CONFIG.find(c => c.key === val || c.label === val);
                      setProgressFormData({
                        ...progressFormData,
                        workCategory: (matched ? matched.key : 'GANG_WORK') as any,
                        workCategoryTitle: val,
                        workDone: progressFormData.workDone || val
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none"
                  >
                    <optgroup label="Standard P-Way Work Categories">
                      {WORK_CATEGORIES_CONFIG.filter(c => c.key !== 'ALL').map(c => (
                        <option key={c.key} value={c.label}>{c.icon} {c.label}</option>
                      ))}
                    </optgroup>
                    {gangWorkTypesList.length > 0 && (
                      <optgroup label="Custom &amp; Firebase Dynamic Work Types">
                        {gangWorkTypesList.map(gt => (
                          <option key={gt.id} value={gt.title}>✨ {gt.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Section</label>
                  <select
                    value={progressFormData.section}
                    onChange={e => setProgressFormData({ ...progressFormData, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {SECTIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.name.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">From Km Pole</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={progressFormData.fromKm}
                    onChange={e => setProgressFormData({ ...progressFormData, fromKm: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">To Km Pole</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={progressFormData.toKm}
                    onChange={e => setProgressFormData({ ...progressFormData, toKm: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Track</label>
                  <select
                    value={progressFormData.trackType}
                    onChange={e => setProgressFormData({ ...progressFormData, trackType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="UP">UP Line</option>
                    <option value="DN">DN Line</option>
                    <option value="BOTH">Both Lines</option>
                    <option value="YARD">Station Yard</option>
                    <option value="LINK">Link Line</option>
                  </select>
                </div>
              </div>

              {/* Machinery Hours & Quantity Output */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    JCB / Machine Hours Worked (if machinery deployed)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={progressFormData.hoursWorked || 8.0}
                    onChange={e => setProgressFormData({ ...progressFormData, hoursWorked: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Total Output Quantity / Span
                  </label>
                  <input
                    type="text"
                    required
                    value={progressFormData.quantityOrLength}
                    onChange={e => setProgressFormData({ ...progressFormData, quantityOrLength: e.target.value })}
                    placeholder="e.g. 2.500 Km, 450 Sleepers"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Work Done Description *</label>
                <textarea
                  rows={2}
                  required
                  value={progressFormData.workDone}
                  onChange={e => setProgressFormData({ ...progressFormData, workDone: e.target.value })}
                  placeholder="Describe track maintenance, drain de-silting, tamping survey, or earthwork executed..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* MTS Representative Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Supervisor / Mate Name &amp; Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={progressFormData.supervisor}
                    onChange={e => setProgressFormData({ ...progressFormData, supervisor: e.target.value })}
                    placeholder="e.g. Gurpreet Singh (Mate / 9876543210)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    DFCCIL Representative (MTS Staff Dropdown) *
                  </label>
                  <select
                    value={progressFormData.dfccilRep}
                    onChange={e => setProgressFormData({ ...progressFormData, dfccilRep: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Pinki Sharma (MTS / 9592751503)">Pinki Sharma (MTS / 9592751503)</option>
                    <option value="Surendera Kumar (MTS / 7658008725)">Surendera Kumar (MTS / 7658008725)</option>
                    <option value="Pawan Kumar (MTS / 9812345678)">Pawan Kumar (MTS / 9812345678)</option>
                    <option value="Sunil Kumar (MTS / 9416000000)">Sunil Kumar (MTS / 9416000000)</option>
                    {outsourceStaffList.map(s => (
                      <option key={s.id} value={`${s.name} (${s.post || 'MTS'} / ${s.phone || '-'})`}>
                        {s.name} ({s.post || 'Staff'} - {s.phone || '-'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MTS Field Progress Photo Upload */}
              <div className="p-3.5 bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5">
                    <span>📸 Site Progress Photo (Uploaded by MTS)</span>
                    <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-normal">
                      (WhatsApp level auto-compression &lt; 200 KB)
                    </span>
                  </label>
                  {(progressFormData.photoUrl || (progressFormData.photos && progressFormData.photos.length > 0)) && (
                    <button
                      type="button"
                      onClick={() => setProgressFormData({ ...progressFormData, photoUrl: undefined, photos: [] })}
                      className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline"
                    >
                      ✕ Remove Photo
                    </button>
                  )}
                </div>

                {progressFormData.photoUrl || (progressFormData.photos && progressFormData.photos.length > 0) ? (
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-cyan-300 dark:border-cyan-700">
                    <img
                      src={progressFormData.photoUrl || progressFormData.photos![0]}
                      alt="MTS Progress"
                      className="w-16 h-16 rounded-lg object-cover border-2 border-cyan-400 shadow-sm shrink-0"
                    />
                    <div className="text-xs space-y-1 min-w-0">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Photo Ready &amp; Compressed</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        Uploaded by: {progressFormData.dfccilRep || 'MTS Representative'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsCompressingPhoto(true);
                        try {
                          const compressed = await compressImageWhatsAppLevel(file);
                          setProgressFormData(prev => ({
                            ...prev,
                            photoUrl: compressed,
                            photos: [compressed]
                          }));
                        } catch (err) {
                          console.error('Error compressing image:', err);
                        } finally {
                          setIsCompressingPhoto(false);
                        }
                      }}
                      className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer"
                    />
                    {isCompressingPhoto && (
                      <span className="text-[10px] text-cyan-600 font-bold animate-pulse mt-1 block">
                        ⏳ Compressing photo to WhatsApp standard (~100 KB)...
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProgressModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#123b72] hover:bg-[#1a4f9c] text-white rounded-xl font-bold shadow-sm"
                >
                  Save Daily Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          MODAL: FULL SIZE PHOTO LIGHTBOX (Uploaded by MTS)
      ---------------------------------------------------------------------- */}
      {selectedPhotoForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scaleUp text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <span>📸 Gang Work Site Photo</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                    MTS Field Capture
                  </span>
                </h4>
                <p className="text-xs text-slate-300 font-medium">{selectedPhotoForModal.title} • {selectedPhotoForModal.km}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoForModal(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-black/60 flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={selectedPhotoForModal.url}
                alt="Full Size Site Progress"
                className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
              />
            </div>

            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <div>Uploaded by MTS: <span className="font-bold text-white">{selectedPhotoForModal.uploader}</span></div>
                <div className="font-mono text-[10px] text-cyan-300">Date: {selectedPhotoForModal.date}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoForModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
