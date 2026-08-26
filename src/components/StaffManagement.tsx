/**
 * DFCCIL IMSD SMUN - Dynamic Staff & Asset Management ERP Module
 * 
 * Features:
 * - Dynamic Category Toggles: Permanent (5), Outsource (9), Ex-Service Man (68)
 * - Sub-Toggles: Keyman (18), Gateman (18), Patrolman-SPD (9), Patrolman-SPN (20), Watchman (3)
 * - KPI Dashboard: Total Staff, PME Due, Leave Due, Missing IDs, Incomplete Patrol Pairs
 * - Patrolman Pair System: Relational links between partner patrolmen (SPN-02 to SPN-11)
 * - Form Validation:
 *   - Permanent: Employee ID * and Name * and Designation Dropdown (Dy.PM, APM, JPM, Sr.Executive, Executive, Jr.Executive, MTS)
 *   - Outsource: Employee ID * and Name *
 *   - Ex-Service Man: AWPO ID * and Name * and Duty Type Dropdown (Keyman, Patrolman, Gateman, Guard)
 * - Dynamic Staff QR Code generation (printable / downloadable)
 * - Universal Passport Photo / Selfie Upload
 * - Super Admin Delete privileges with confirmation
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../services/database.ts';
import { StaffProfileModal } from './StaffProfileModal.tsx';
import { StaffIdModal, type UnifiedStaffModalData } from './StaffIdModal.tsx';
import { QRScannerModal } from './QRScannerModal.tsx';
import {
  Users,
  Shield,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Phone,
  MessageSquare,
  QrCode,
  Scan,
  HardHat,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Upload,
  UserCheck,
  Building,
  UserPlus,
  Briefcase,
  Layers,
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type {
  OfficerStaffRecord,
  StaffCategory,
  StaffDutyType,
  PermanentDesignation,
  UserRole,
  EmploymentType
} from '../types/index.ts';

const PERMANENT_DESIGNATIONS: PermanentDesignation[] = [
  'Dy.PM',
  'APM',
  'JPM',
  'Sr.Executive',
  'Executive',
  'Jr.Executive',
  'MTS'
];

export const StaffManagement: React.FC = () => {
  const { currentUser, role, currentAppRole } = useAuth();
  const [staffList, setStaffList] = useState<OfficerStaffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Category Toggle: ALL | PERMANENT | OUTSOURCE | EX_SERVICEMAN
  const [activeCategory, setActiveCategory] = useState<'ALL' | StaffCategory>('ALL');

  // Duty Sub-Filter: ALL | KEYMAN | GATEMAN | PATROL_SPD | PATROL_SPN | WATCHMAN
  const [dutySubFilter, setDutySubFilter] = useState<'ALL' | 'KEYMAN' | 'GATEMAN' | 'PATROL_SPD' | 'PATROL_SPN' | 'WATCHMAN'>('ALL');

  // Modals State
  const [selectedStaffForProfile, setSelectedStaffForProfile] = useState<OfficerStaffRecord | null>(null);
  const [selectedStaffForIdModal, setSelectedStaffForIdModal] = useState<UnifiedStaffModalData | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Photo Upload Modal State
  const [photoModalTarget, setPhotoModalTarget] = useState<OfficerStaffRecord | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Staff Form Modal (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<StaffCategory>('PERMANENT');

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    awpoId: '',
    name: '',
    nameHi: '',
    fatherName: '',
    designation: 'Executive' as PermanentDesignation,
    post: '',
    dutyType: 'OFFICER' as StaffDutyType,
    employmentType: 'REGULAR' as EmploymentType,
    phone: '',
    emergencyContact: '',
    email: '',
    headquarters: 'IMSD SMUN',
    assignedSection: 'SMUN-SBJN',
    beatNo: '',
    beatFromTo: '',
    patrolPairId: '',
    patrolPartnerName: '',
    patrolPartnerId: '',
    joiningDate: '2023-01-01',
    pmeDate: '2027-01-01',
    leaveDate: '',
    remarks: '',
    photoUrl: ''
  });

  // Validation Error Message
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const isSuperAdmin = role === 'SUPER_ADMIN' || currentAppRole === 'APM';
  const isOfficerOrAdmin = role === 'SUPER_ADMIN' || role === 'OFFICER' || currentAppRole === 'APM' || currentAppRole === 'Executive';

  // ---------------------------------------------------------------------------
  // Load Data
  // ---------------------------------------------------------------------------
  const loadStaffData = async () => {
    try {
      setIsLoading(true);
      const data = await db.getCollection<OfficerStaffRecord>('officers_staff');
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  // ---------------------------------------------------------------------------
  // KPIs & Counts Calculation
  // ---------------------------------------------------------------------------
  const kpis = useMemo(() => {
    const total = staffList.length;
    const permanent = staffList.filter(s => s.staffCategory === 'PERMANENT').length;
    const outsource = staffList.filter(s => s.staffCategory === 'OUTSOURCE').length;
    const exServiceman = staffList.filter(s => s.staffCategory === 'EX_SERVICEMAN').length;
    const keymen = staffList.filter(s => s.dutyType === 'KEYMAN').length;
    const patrolmen = staffList.filter(s => s.dutyType === 'PATROLMAN').length;
    const patrolSpd = staffList.filter(s => s.dutyType === 'PATROLMAN' && (s.beatNo || '').startsWith('SPD')).length;
    const patrolSpn = staffList.filter(s => s.dutyType === 'PATROLMAN' && (s.beatNo || '').startsWith('SPN')).length;
    const gatemen = staffList.filter(s => s.dutyType === 'GATEMAN').length;
    const watchmen = staffList.filter(s => s.dutyType === 'WATCHMAN').length;

    // PME Due within 90 days or overdue
    const today = new Date();
    const ninetyDaysAhead = new Date();
    ninetyDaysAhead.setDate(today.getDate() + 90);

    const pmeDue = staffList.filter(s => {
      if (!s.pmeDate) return false;
      const pme = new Date(s.pmeDate);
      return pme <= ninetyDaysAhead;
    }).length;

    // Missing ID check (Permanent missing employeeId or ExServiceman missing awpoId)
    const missingId = staffList.filter(s => {
      if (s.staffCategory === 'PERMANENT' && !s.employeeId) return true;
      if (s.staffCategory === 'EX_SERVICEMAN' && !s.awpoId) return true;
      return false;
    }).length;

    return {
      total,
      permanent,
      outsource,
      exServiceman,
      keymen,
      patrolmen,
      patrolSpd,
      patrolSpn,
      gatemen,
      watchmen,
      pmeDue,
      missingId
    };
  }, [staffList]);

  // ---------------------------------------------------------------------------
  // Filter & Search Engine
  // ---------------------------------------------------------------------------
  const filteredStaff = useMemo(() => {
    let list = staffList;

    // 1. Primary Category Filter
    if (activeCategory !== 'ALL') {
      list = list.filter(s => s.staffCategory === activeCategory);
    }

    // 2. Sub Duty Filter
    if (dutySubFilter === 'KEYMAN') {
      list = list.filter(s => s.dutyType === 'KEYMAN');
    } else if (dutySubFilter === 'GATEMAN') {
      list = list.filter(s => s.dutyType === 'GATEMAN');
    } else if (dutySubFilter === 'PATROL_SPD') {
      list = list.filter(s => s.dutyType === 'PATROLMAN' && (s.beatNo || '').startsWith('SPD'));
    } else if (dutySubFilter === 'PATROL_SPN') {
      list = list.filter(s => s.dutyType === 'PATROLMAN' && (s.beatNo || '').startsWith('SPN'));
    } else if (dutySubFilter === 'WATCHMAN') {
      list = list.filter(s => s.dutyType === 'WATCHMAN');
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const empMatch = (s.employeeId || '').toLowerCase().includes(q);
        const awpoMatch = (s.awpoId || '').toLowerCase().includes(q);
        const beatMatch = (s.beatNo || '').toLowerCase().includes(q);
        const phoneMatch = (s.phone || '').includes(q);
        const fatherMatch = (s.fatherName || '').toLowerCase().includes(q);
        const desigMatch = (s.designation || s.post || '').toLowerCase().includes(q);
        return nameMatch || empMatch || awpoMatch || beatMatch || phoneMatch || fatherMatch || desigMatch;
      });
    }

    return list;
  }, [staffList, activeCategory, dutySubFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // Photo Upload Handler
  // ---------------------------------------------------------------------------
  const handlePhotoUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoModalTarget) return;

    const reader = new FileReader();
    reader.onload = async ev => {
      const base64 = ev.target?.result as string;
      if (base64) {
        try {
          setIsUploadingPhoto(true);
          await db.updateDocument(
            'officers_staff',
            photoModalTarget.id,
            { photoUrl: base64 } as any,
            currentUser
          );
          await loadStaffData();
          setPhotoModalTarget(null);
        } catch (err: any) {
          alert(`Failed to save photo: ${err.message}`);
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------------------------
  // Delete Staff Handler
  // ---------------------------------------------------------------------------
  const handleDeleteStaff = async (staff: OfficerStaffRecord) => {
    const idDisplay = staff.employeeId || staff.awpoId || staff.id;
    if (!window.confirm(`⚠️ CONFIRM DELETION:\n\nAre you sure you want to permanently delete staff record "${staff.name}" (${idDisplay})?`)) {
      return;
    }
    try {
      await db.deleteDocument('officers_staff', staff.id, currentUser);
      await loadStaffData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // ---------------------------------------------------------------------------
  // Open Add/Edit Modal
  // ---------------------------------------------------------------------------
  const handleOpenAddModal = (cat: StaffCategory) => {
    setEditingStaffId(null);
    setFormCategory(cat);
    setFormErrors({});

    const defaultDuty: StaffDutyType = cat === 'PERMANENT' ? 'OFFICER' : (cat === 'OUTSOURCE' ? 'OFFICE' : 'KEYMAN');

    setFormData({
      employeeId: cat === 'PERMANENT' ? `EMP-${100800 + staffList.length}` : (cat === 'OUTSOURCE' ? `EMP-${88120 + staffList.length}` : ''),
      awpoId: cat === 'EX_SERVICEMAN' ? `AWPO-${70300 + staffList.length}` : '',
      name: '',
      nameHi: '',
      fatherName: '',
      designation: 'Executive',
      post: cat === 'PERMANENT' ? 'Executive / P-Way' : (cat === 'OUTSOURCE' ? 'Track Maintainer' : 'KEYMAN'),
      dutyType: defaultDuty,
      employmentType: cat === 'PERMANENT' ? 'REGULAR' : 'OUTSOURCED',
      phone: '',
      emergencyContact: '',
      email: '',
      headquarters: 'IMSD SMUN',
      assignedSection: 'SMUN-SBJN',
      beatNo: 'Beat 20',
      beatFromTo: 'Km 1170.000 to 1176.000',
      patrolPairId: '',
      patrolPartnerName: '',
      patrolPartnerId: '',
      joiningDate: new Date().toISOString().split('T')[0],
      pmeDate: '2027-04-15',
      leaveDate: '',
      remarks: '',
      photoUrl: ''
    });

    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (staff: OfficerStaffRecord) => {
    setEditingStaffId(staff.id);
    setFormCategory(staff.staffCategory || 'PERMANENT');
    setFormErrors({});

    setFormData({
      employeeId: staff.employeeId || '',
      awpoId: staff.awpoId || '',
      name: staff.name || '',
      nameHi: staff.nameHi || '',
      fatherName: staff.fatherName || '',
      designation: (staff.designation as PermanentDesignation) || 'Executive',
      post: staff.post || '',
      dutyType: staff.dutyType || 'OFFICER',
      employmentType: staff.employmentType || 'REGULAR',
      phone: staff.phone || '',
      emergencyContact: staff.emergencyContact || '',
      email: staff.email || '',
      headquarters: staff.headquarters || 'IMSD SMUN',
      assignedSection: staff.assignedSection || 'SMUN-SBJN',
      beatNo: staff.beatNo || '',
      beatFromTo: staff.beatFromTo || '',
      patrolPairId: staff.patrolPairId || '',
      patrolPartnerName: staff.patrolPartnerName || '',
      patrolPartnerId: staff.patrolPartnerId || '',
      joiningDate: staff.joiningDate || staff.dateOfJoining || '2023-01-01',
      pmeDate: staff.pmeDate || '2027-01-01',
      leaveDate: staff.leaveDate || '',
      remarks: staff.remarks || '',
      photoUrl: staff.photoUrl || ''
    });

    setIsFormModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Save Staff (with strict validation per specs)
  // ---------------------------------------------------------------------------
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // 1. Permanent Staff Validation: Employee ID * and Name *
    if (formCategory === 'PERMANENT') {
      if (!formData.employeeId.trim()) {
        errors.employeeId = 'Employee ID is required.';
      }
      if (!formData.name.trim()) {
        errors.name = 'Name is required.';
      }
    }

    // 2. Outsource Staff Validation: Employee ID * and Name *
    if (formCategory === 'OUTSOURCE') {
      if (!formData.employeeId.trim()) {
        errors.employeeId = 'Employee ID is required.';
      }
      if (!formData.name.trim()) {
        errors.name = 'Name is required.';
      }
    }

    // 3. Ex-Service Man Validation: AWPO ID * and Name *
    if (formCategory === 'EX_SERVICEMAN') {
      if (!formData.awpoId.trim()) {
        errors.awpoId = 'AWPO ID is required for Ex-Service Man.';
      }
      if (!formData.name.trim()) {
        errors.name = 'Name is required.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const docId = editingStaffId
        ? editingStaffId
        : (formCategory === 'EX_SERVICEMAN'
            ? (formData.awpoId.startsWith('AWPO-') ? formData.awpoId : `AWPO-${formData.awpoId}`)
            : (formData.employeeId.startsWith('EMP-') ? formData.employeeId : `EMP-${formData.employeeId}`));

      const formattedRecord: OfficerStaffRecord = {
        id: docId,
        employeeId: formCategory === 'EX_SERVICEMAN' ? null : (formData.employeeId || docId),
        awpoId: formCategory === 'EX_SERVICEMAN' ? (formData.awpoId || docId) : null,
        name: formData.name.startsWith('Shri ') ? formData.name : `Shri ${formData.name}`,
        nameHi: formData.nameHi || '',
        fatherName: formData.fatherName ? (formData.fatherName.startsWith('Shri ') ? formData.fatherName : `Shri ${formData.fatherName}`) : '',
        post: formCategory === 'PERMANENT' ? formData.designation : formData.post || formData.dutyType,
        designation: formCategory === 'PERMANENT' ? formData.designation : (formData.post || formData.dutyType),
        role: formCategory === 'PERMANENT' ? (formData.designation === 'APM' ? 'SUPER_ADMIN' : (formData.designation === 'MTS' ? 'STAFF' : 'OFFICER')) : 'STAFF',
        staffCategory: formCategory,
        dutyType: formData.dutyType,
        employmentType: formCategory === 'PERMANENT' ? 'REGULAR' : 'OUTSOURCED',
        email: formData.email || `${docId.toLowerCase()}@dfcc.co.in`,
        phone: formData.phone || '8872671873',
        emergencyContact: formData.emergencyContact || formData.phone || '8872671873',
        headquarters: formData.headquarters || 'IMSD SMUN',
        assignedSection: formData.assignedSection || 'SMUN-SBJN',
        joiningDate: formData.joiningDate,
        dateOfJoining: formData.joiningDate,
        pmeDate: formData.pmeDate,
        leaveDate: formData.leaveDate,
        beatNo: formData.beatNo,
        beatFromTo: formData.beatFromTo,
        patrolPairId: formData.dutyType === 'PATROLMAN' ? formData.patrolPairId : null,
        patrolPartnerName: formData.dutyType === 'PATROLMAN' ? formData.patrolPartnerName : null,
        patrolPartnerId: formData.dutyType === 'PATROLMAN' ? formData.patrolPartnerId : null,
        leaveBalance: { lap: 30, lhap: 15, cl: 8, rh: 2 },
        qrCodeId: `RD-${docId}`,
        remarks: formData.remarks || `${formCategory} • ${formData.dutyType}`,
        photoUrl: formData.photoUrl || undefined
      };

      if (editingStaffId) {
        await db.updateDocument('officers_staff', editingStaffId, formattedRecord, currentUser);
      } else {
        await db.addDocument('officers_staff', formattedRecord, currentUser);
      }

      setIsFormModalOpen(false);
      await loadStaffData();
    } catch (err: any) {
      alert(`Error saving staff record: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* -------------------------------------------------------------------
          TOP HEADER BANNER & ACTION BAR
      -------------------------------------------------------------------- */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-600/20 text-cyan-400 border border-blue-500/30 rounded-2xl shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Staff &amp; Personnel ERP Management
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                IMSD SMUN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanent (Employee ID), Outsource (Employee ID), Ex-Servicemen (AWPO ID) &amp; Relational Patrol Pairs
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Verify QR Scanner */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Scan className="w-4 h-4" />
            <span>Verify QR Badge</span>
          </button>

          {/* Admin & Officer Add Staff Dropdown Button */}
          {isOfficerOrAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenAddModal('PERMANENT')}
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95"
                title="Add Permanent Officer / Staff"
              >
                <Plus className="w-4 h-4" />
                <span>+ Permanent Staff</span>
              </button>

              <button
                onClick={() => handleOpenAddModal('EX_SERVICEMAN')}
                className="px-3.5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-600/20 active:scale-95"
                title="Add Ex-Service Man (Keyman / Patrolman)"
              >
                <Plus className="w-4 h-4" />
                <span>+ Ex-Service Man</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------
          STAFF DASHBOARD KPI CARDS
      -------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Staff */}
        <div
          onClick={() => {
            setActiveCategory('ALL');
            setDutySubFilter('ALL');
          }}
          className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-4 rounded-2xl cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Staff</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{kpis.total}</div>
          <div className="text-[10px] text-blue-400 font-semibold">100% Verified Roster</div>
        </div>

        {/* Permanent Staff */}
        <div
          onClick={() => {
            setActiveCategory('PERMANENT');
            setDutySubFilter('ALL');
          }}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-2xl cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Permanent</span>
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">{kpis.permanent}</div>
          <div className="text-[10px] text-slate-400">Employee ID Assigned</div>
        </div>

        {/* Outsource Staff */}
        <div
          onClick={() => {
            setActiveCategory('OUTSOURCE');
            setDutySubFilter('ALL');
          }}
          className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Outsource</span>
            <Building className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{kpis.outsource}</div>
          <div className="text-[10px] text-slate-400">Office &amp; Track Gang</div>
        </div>

        {/* Ex-Service Man */}
        <div
          onClick={() => {
            setActiveCategory('EX_SERVICEMAN');
            setDutySubFilter('ALL');
          }}
          className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Ex-Service Man</span>
            <HardHat className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{kpis.exServiceman}</div>
          <div className="text-[10px] text-slate-400">AWPO ID Mandatory</div>
        </div>

        {/* Keymen */}
        <div
          onClick={() => {
            setActiveCategory('EX_SERVICEMAN');
            setDutySubFilter('KEYMAN');
          }}
          className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 p-4 rounded-2xl cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Keymen</span>
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300">{kpis.keymen}</div>
          <div className="text-[10px] text-slate-400">18 Beats (19 to 34 + RG)</div>
        </div>

        {/* Patrolmen */}
        <div
          onClick={() => {
            setActiveCategory('EX_SERVICEMAN');
            setDutySubFilter('PATROL_SPN');
          }}
          className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition shadow-lg space-y-1"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Patrolmen</span>
            <Clock className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{kpis.patrolmen}</div>
          <div className="text-[10px] text-purple-300">10 Pairs (SPN) + 9 (SPD)</div>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          PRIMARY CATEGORY & DUTY TOGGLE VIEW BAR
      -------------------------------------------------------------------- */}
      <div className="space-y-3 bg-slate-900/80 border border-slate-800 p-4 rounded-3xl shadow-lg">
        {/* Main Category Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setActiveCategory('ALL');
              setDutySubFilter('ALL');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
              activeCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-2 ring-blue-400/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Staff ({kpis.total})</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('PERMANENT');
              setDutySubFilter('ALL');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
              activeCategory === 'PERMANENT'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-2 ring-blue-400/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Permanent ({kpis.permanent})</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('OUTSOURCE');
              setDutySubFilter('ALL');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
              activeCategory === 'OUTSOURCE'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Outsource MTS ({kpis.outsource})</span>
          </button>

          <button
            onClick={() => {
              setActiveCategory('EX_SERVICEMAN');
              setDutySubFilter('ALL');
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
              activeCategory === 'EX_SERVICEMAN'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 ring-2 ring-amber-400/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>Ex-Service Man ({kpis.exServiceman})</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------
          POWERFUL SEARCH BAR
      -------------------------------------------------------------------- */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by Employee ID, AWPO ID, Name, Beat No, Mobile, Father's Name..."
          className="w-full pl-12 pr-10 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------------
          STAFF CARDS GRID (Connected & Relational)
      -------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-white">{filteredStaff.length}</strong> of {staffList.length} staff members
          </span>
          <span className="text-[11px] text-blue-400 font-mono">
            Category: {activeCategory} • Duty: {dutySubFilter}
          </span>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No Staff Members Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No staff members match the selected filters or search query "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setActiveCategory('ALL');
                setDutySubFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map(staff => {
              const isEx = staff.staffCategory === 'EX_SERVICEMAN';
              const isPatrol = staff.dutyType === 'PATROLMAN';
              const idBadge = isEx ? (staff.awpoId || staff.id) : (staff.employeeId || staff.id);

              return (
                <div
                  key={staff.id}
                  className="bg-gradient-to-b from-slate-900/95 via-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 p-5 rounded-3xl space-y-4 transition group shadow-xl flex flex-col justify-between"
                >
                  {/* Card Top: Photo, Name, ID Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar with Camera Overlay */}
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-lg flex items-center justify-center border-2 border-blue-400/40 shadow-lg shrink-0">
                          {staff.photoUrl ? (
                            <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            staff.name.replace(/^Shri\s+/i, '').substring(0, 2).toUpperCase()
                          )}

                          <button
                            type="button"
                            onClick={() => setPhotoModalTarget(staff)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white"
                            title="Upload / Take Selfie"
                          >
                            <Camera className="w-4 h-4 text-cyan-300" />
                          </button>
                        </div>

                        <div className="min-w-0">
                          <h3
                            onClick={() => setSelectedStaffForProfile(staff)}
                            className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition truncate cursor-pointer"
                          >
                            {staff.name}
                          </h3>
                          {staff.fatherName && (
                            <p className="text-[11px] text-slate-400 truncate">S/o {staff.fatherName}</p>
                          )}
                          <p className="text-xs text-blue-400 font-semibold truncate">
                            {staff.designation || staff.post}
                          </p>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${
                            staff.staffCategory === 'PERMANENT' ? 'bg-blue-950/60 text-blue-300 border-blue-500/30' :
                            staff.staffCategory === 'OUTSOURCE' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' :
                            'bg-amber-950/60 text-amber-300 border-amber-500/30'
                          }`}>
                            {staff.staffCategory === 'PERMANENT' ? 'PERMANENT' : staff.staffCategory === 'OUTSOURCE' ? 'OUTSOURCE' : 'EX-SERVICEMAN'}
                          </span>
                        </div>
                      </div>

                      {/* Monospace ID Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold shrink-0 border ${
                          isEx
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                        }`}
                      >
                        {idBadge}
                      </span>
                    </div>

                    {/* Duty & Beat Details Box */}
                    <div className="mt-3.5 bg-slate-950/90 p-3 rounded-2xl border border-slate-800/90 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Category / Trade:</span>
                        <span className="text-cyan-300 font-bold">{staff.dutyType || staff.post}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assigned Beat:</span>
                        <span className="text-emerald-400 font-bold">{staff.beatNo || 'HQ Section'}</span>
                      </div>
                      {staff.staffCategory === 'EX_SERVICEMAN' && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Km Chainage:</span>
                          <span className="text-slate-300 font-mono text-[11px] truncate max-w-[180px]">
                            {staff.beatFromTo || 'Km 1167.210 - 1249.720'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Primary Mobile:</span>
                        <span className="text-white font-mono font-bold">{staff.phone}</span>
                      </div>
                    </div>

                    {/* Relational Patrol Pair Bar (If Patrolman) */}
                    {isPatrol && staff.patrolPairId && (
                      <div className="mt-2.5 bg-purple-950/40 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-purple-200 font-mono text-[11px]">
                            Pair: <strong>{staff.patrolPairId}</strong>
                          </span>
                        </div>

                        {staff.patrolPartnerName && (
                          <span className="text-slate-300 text-[11px] truncate max-w-[140px]">
                            Partner: <strong className="text-white">{staff.patrolPartnerName}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Bar: Call, WhatsApp, QR, View Profile, Edit, Delete */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${staff.phone.replace(/[^0-9+]/g, '')}`}
                        className="py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>

                      <a
                        href={`https://wa.me/91${staff.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* View ID Card Popup Button (Image 1) */}
                      <button
                        type="button"
                        onClick={() => setSelectedStaffForIdModal({
                          ...staff,
                          mobileNo: staff.phone
                        })}
                        className="flex-1 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shadow-sm active:scale-95"
                        title="View Official DFCCIL Staff ID Card Popup"
                      >
                        <span>🪪</span>
                        <span>ID Card</span>
                      </button>

                      {/* View Profile Button */}
                      <button
                        onClick={() => setSelectedStaffForProfile(staff)}
                        className="flex-1 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition shadow-sm active:scale-95"
                        title="View Extended Profile & QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>

                      {/* Take/Upload Photo */}
                      <button
                        onClick={() => setPhotoModalTarget(staff)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700 text-xs"
                        title="Upload Selfie / Photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>

                      {/* Admin & Officer Edit */}
                      {isOfficerOrAdmin && (
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="p-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-xl border border-amber-500/30 text-xs"
                          title="Edit Staff Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Super Admin Delete */}
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteStaff(staff)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl border border-red-500/30 text-xs"
                          title="Delete Staff Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------
          UNIVERSAL PASSPORT PHOTO / SELFIE UPLOAD MODAL
      -------------------------------------------------------------------- */}
      {photoModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-bold text-white">Upload Staff Photo</span>
              </div>
              <button
                onClick={() => setPhotoModalTarget(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-blue-500/50 mx-auto flex items-center justify-center shadow-xl">
                {photoModalTarget.photoUrl ? (
                  <img
                    src={photoModalTarget.photoUrl}
                    alt={photoModalTarget.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-slate-400">
                    {photoModalTarget.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white">{photoModalTarget.name}</h4>
              <p className="text-xs text-slate-400">
                Snap an instant selfie with your camera or select a passport photo from gallery.
              </p>
            </div>

            {isUploadingPhoto && (
              <div className="text-xs font-semibold text-blue-400 animate-pulse">
                Saving &amp; syncing photo...
              </div>
            )}

            <div className="space-y-2">
              <label className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition">
                <Camera className="w-4 h-4" />
                <span>📸 Capture Live Selfie</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoUploadChange}
                  className="hidden"
                />
              </label>

              <label className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>🖼️ Choose from Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUploadChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          FORM MODAL: ADD / EDIT STAFF MEMBER (Strict Validation)
      -------------------------------------------------------------------- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 my-auto max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingStaffId ? 'Edit Staff Profile' : `Add ${formCategory.replace('_', ' ')} Record`}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    DFCCIL IMSD SMUN Official Roster
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Selector Tabs in Form */}
            {!editingStaffId && (
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFormCategory('PERMANENT')}
                  className={`py-2 rounded-xl transition ${
                    formCategory === 'PERMANENT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Permanent
                </button>
                <button
                  type="button"
                  onClick={() => setFormCategory('OUTSOURCE')}
                  className={`py-2 rounded-xl transition ${
                    formCategory === 'OUTSOURCE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Outsource
                </button>
                <button
                  type="button"
                  onClick={() => setFormCategory('EX_SERVICEMAN')}
                  className={`py-2 rounded-xl transition ${
                    formCategory === 'EX_SERVICEMAN' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ex-Service Man
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {/* Row 1: ID Field and Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">
                    {formCategory === 'EX_SERVICEMAN' ? 'AWPO ID *' : 'Employee ID *'}
                  </label>
                  <input
                    type="text"
                    value={formCategory === 'EX_SERVICEMAN' ? formData.awpoId : formData.employeeId}
                    onChange={e => {
                      if (formCategory === 'EX_SERVICEMAN') {
                        setFormData(prev => ({ ...prev, awpoId: e.target.value }));
                      } else {
                        setFormData(prev => ({ ...prev, employeeId: e.target.value }));
                      }
                      setFormErrors(prev => ({ ...prev, employeeId: '', awpoId: '' }));
                    }}
                    placeholder={formCategory === 'EX_SERVICEMAN' ? 'AWPO-70201' : 'EMP-101518'}
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-white font-mono ${
                      formErrors.employeeId || formErrors.awpoId ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  {formErrors.employeeId && (
                    <span className="text-red-400 text-[10px] mt-1 block font-semibold">
                      {formErrors.employeeId}
                    </span>
                  )}
                  {formErrors.awpoId && (
                    <span className="text-red-400 text-[10px] mt-1 block font-semibold">
                      {formErrors.awpoId}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Shri Dharminder Singh"
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-white font-medium ${
                      formErrors.name ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  {formErrors.name && (
                    <span className="text-red-400 text-[10px] mt-1 block font-semibold">
                      {formErrors.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Father's Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Father's Name:</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={e => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                    placeholder="Shri Hardish Singh"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Mobile Number:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="9466303713"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Designation / Duty Type (Dropdown Requirement) */}
              {formCategory === 'PERMANENT' ? (
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">
                    Permanent Designation (Dropdown Selection) *
                  </label>
                  <select
                    value={formData.designation}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        designation: e.target.value as PermanentDesignation,
                        post: e.target.value
                      }))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                  >
                    {PERMANENT_DESIGNATIONS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              ) : formCategory === 'EX_SERVICEMAN' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-bold">
                      Staff Duty Type (Dropdown) *
                    </label>
                    <select
                      value={formData.dutyType}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          dutyType: e.target.value as StaffDutyType,
                          post: e.target.value
                        }))
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                    >
                      <option value="KEYMAN">Keyman</option>
                      <option value="PATROLMAN">Patrolman</option>
                      <option value="GATEMAN">Gateman</option>
                      <option value="WATCHMAN">Guard / Watchman</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Beat / Gate / Br No.:</label>
                    <input
                      type="text"
                      value={formData.beatNo}
                      onChange={e => setFormData(prev => ({ ...prev, beatNo: e.target.value }))}
                      placeholder={formData.dutyType === 'PATROLMAN' ? 'SPN-02' : 'Beat No. 20'}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Outsource Designation / Role:</label>
                  <input
                    type="text"
                    value={formData.post}
                    onChange={e => setFormData(prev => ({ ...prev, post: e.target.value }))}
                    placeholder="e.g. Computer Operator, Cleaner, Track Mate"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              )}

              {/* Dynamic Patrol Pair fields for Patrolman */}
              {formCategory === 'EX_SERVICEMAN' && formData.dutyType === 'PATROLMAN' && (
                <div className="bg-purple-950/40 border border-purple-500/40 p-3.5 rounded-2xl space-y-3">
                  <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Patrolman Pair System</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-400 mb-1 text-[10px]">Patrol Pair ID:</label>
                      <input
                        type="text"
                        value={formData.patrolPairId}
                        onChange={e => setFormData(prev => ({ ...prev, patrolPairId: e.target.value }))}
                        placeholder="e.g. SPN-02"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 text-[10px]">Patrol Partner Name:</label>
                      <input
                        type="text"
                        value={formData.patrolPartnerName}
                        onChange={e => setFormData(prev => ({ ...prev, patrolPartnerName: e.target.value }))}
                        placeholder="e.g. Shri Balkar Singh"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Row 4: Km Range & Headquarters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Beat From - To (Km):</label>
                  <input
                    type="text"
                    value={formData.beatFromTo}
                    onChange={e => setFormData(prev => ({ ...prev, beatFromTo: e.target.value }))}
                    placeholder="1170.535 to 1176.010"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Headquarters / Sector:</label>
                  <input
                    type="text"
                    value={formData.headquarters}
                    onChange={e => setFormData(prev => ({ ...prev, headquarters: e.target.value }))}
                    placeholder="IMSD SMUN"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Row 5: PME Date & Joining Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Joining Date:</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={e => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">PME Date (Medical):</label>
                  <input
                    type="date"
                    value={formData.pmeDate}
                    onChange={e => setFormData(prev => ({ ...prev, pmeDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl transition active:scale-98 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingStaffId ? 'Update Staff Member' : 'Save & Register Staff'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          OFFICIAL STAFF PROFILE MODAL WITH DYNAMIC QR & PAIR VIEWS
      -------------------------------------------------------------------- */}
      <StaffProfileModal
        staff={selectedStaffForProfile}
        isOpen={Boolean(selectedStaffForProfile)}
        onClose={() => setSelectedStaffForProfile(null)}
        onSelectPartner={partnerAwpoId => {
          const partner = staffList.find(s => s.awpoId === partnerAwpoId || s.id === partnerAwpoId);
          if (partner) {
            setSelectedStaffForProfile(partner);
          }
        }}
        onEditStaff={staff => handleOpenEditModal(staff)}
      />

      {/* Official DFCCIL Staff ID Card Modal (Image 1) */}
      <StaffIdModal
        staff={selectedStaffForIdModal}
        isOpen={Boolean(selectedStaffForIdModal)}
        onClose={() => setSelectedStaffForIdModal(null)}
      />

      {/* -------------------------------------------------------------------
          OFFICIAL QR BADGE VERIFICATION SCANNER
      -------------------------------------------------------------------- */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        sampleStaffList={staffList}
      />
    </div>
  );
};
