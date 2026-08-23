/**
 * DFCCIL IMSD SMUN Staff & Personnel Directory
 * Features:
 * - Clean Light Theme matching Image 1 (Official Contact Directory) + Deep Navy Dark Theme
 * - 4 Interactive Tabs: Permanent Officers & Staff, Outsource Staff, Keymen Beats, Patrol Shifts
 * - Outsource Category Filters: All, Office Staff, Gang Units, Track Maintainer
 * - 📸 Passport Photo / Selfie Upload & Live Camera Capture for ALL Staff
 * - 🚨 Alert Mode for Vacant/Unmanned Beats with Quick Assignment Modal
 * - 🗑️ Delete Option & Add/Edit Staff Modal for Super Admin
 * - 🪪 Scannable Personal QR Badges & QR Verification Scanner
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { db } from '../services/database.ts';
import { PersonalQRModal } from './PersonalQRModal.tsx';
import { QRScannerModal } from './QRScannerModal.tsx';
import { StaffIdModal, type UnifiedStaffModalData } from './StaffIdModal.tsx';
import {
 Users,
 QrCode,
 Scan,
 Phone,
 Mail,
 Shield,
 Edit,
 Trash2,
 Plus,
 Search,
 Filter,
 CheckCircle2,
 Clock,
 Camera,
 X,
 Upload,
 UserPlus,
 ShieldAlert,
 HardHat,
 Download,
 Sun,
 Moon,
 MoreVertical,
 FileText,
 Check,
 ExternalLink
} from 'lucide-react';
import type {
  OfficerStaffRecord,
  KeymanRecord,
  PatrolShiftRecord,
  BridgeWatchmanRecord,
  LevelCrossingRecord,
  EmploymentType,
  UserRole
} from '../types/index.ts';

interface StaffDirectoryProps {
  initialTab?: 'master' | 'officers' | 'outsourced' | 'keymen' | 'gatemen' | 'patrol' | 'watchmen';
}

const DEFAULT_BEAT_ROUTES: Record<string, { fromKm: number; toKm: number; section: string; shiftHoursDay: string; shiftHoursNight: string }> = {
  'SPD-01': { fromKm: 1167.210, toKm: 1170.435, section: 'IMSD SMUN SPD-01 (KRJN - SMUN)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-02': { fromKm: 1170.435, toKm: 1177.000, section: 'IMSD SMUN SPD-02 (SMUN Yard)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-03': { fromKm: 1177.000, toKm: 1184.000, section: 'IMSD SMUN SPD-03 (SMUN - SBJN Block)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-04': { fromKm: 1184.000, toKm: 1188.575, section: 'IMSD SMUN SPD-04 (SBJN Approach)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-05': { fromKm: 1188.575, toKm: 1195.000, section: 'IMSD SMUN SPD-05 (SBJN Yard)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-06': { fromKm: 1195.000, toKm: 1202.015, section: 'IMSD SMUN SPD-06 (SBJN - NSIR)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-07': { fromKm: 1202.015, toKm: 1208.000, section: 'IMSD SMUN SPD-07 (NSIR Yard)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-08': { fromKm: 1208.000, toKm: 1213.187, section: 'IMSD SMUN SPD-08 (NSIR - GVGN)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-09': { fromKm: 1213.187, toKm: 1221.000, section: 'IMSD SMUN SPD-09 (GVGN Yard)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-10': { fromKm: 1221.000, toKm: 1229.087, section: 'IMSD SMUN SPD-10 (GVGN - KNNN)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-11': { fromKm: 1229.087, toKm: 1235.837, section: 'IMSD SMUN SPD-11 (KNNN - CHAN)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPD-12': { fromKm: 1235.837, toKm: 1249.720, section: 'IMSD SMUN SPD-12 (CHAN - SNL)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-01': { fromKm: 1167.210, toKm: 1170.435, section: 'IMSD SMUN SPN-01 (KRJN - SMUN Link)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-02': { fromKm: 1170.435, toKm: 1177.000, section: 'IMSD SMUN SPN-02 (SMUN Detour)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-03': { fromKm: 1177.000, toKm: 1184.000, section: 'IMSD SMUN SPN-03 (SMUN - SBJN Mid)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-04': { fromKm: 1184.000, toKm: 1188.575, section: 'IMSD SMUN SPN-04 (SBJN Station)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-05': { fromKm: 1188.575, toKm: 1195.000, section: 'IMSD SMUN SPN-05 (SBJN East)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-06': { fromKm: 1195.000, toKm: 1202.015, section: 'IMSD SMUN SPN-06 (SBJN - NSIR Block)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-07': { fromKm: 1202.015, toKm: 1208.000, section: 'IMSD SMUN SPN-07 (NSIR Station)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-08': { fromKm: 1208.000, toKm: 1213.187, section: 'IMSD SMUN SPN-08 (NSIR - GVGN Mid)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-09': { fromKm: 1213.187, toKm: 1221.000, section: 'IMSD SMUN SPN-09 (GVGN Yard Block)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-10': { fromKm: 1221.000, toKm: 1229.087, section: 'IMSD SMUN SPN-10 (KNNN Approach)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-11': { fromKm: 1241.150, toKm: 1245.000, section: 'IMSD SMUN SPN-11 (CHAN Yard)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' },
  'SPN-12': { fromKm: 1245.000, toKm: 1249.720, section: 'IMSD SMUN SPN-12 (CHAN - SNL)', shiftHoursDay: '15:00 - 23:00', shiftHoursNight: '23:00 - 07:00' }
};

export const StaffDirectory: React.FC<StaffDirectoryProps> = ({ initialTab = 'master' }) => {
  const { currentUser, role } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'master' | 'officers' | 'outsourced' | 'keymen' | 'gatemen' | 'patrol' | 'watchmen'>(initialTab);
  const [masterCategoryFilter, setMasterCategoryFilter] = useState<'ALL' | 'PERMANENT' | 'OUTSOURCE' | 'KEYMAN' | 'PATROLMAN' | 'GATEMAN' | 'WATCHMAN'>('ALL');
  const [outsourceFilter, setOutsourceFilter] = useState<'ALL' | 'OFFICE' | 'GANG' | 'MAINTAINER'>('ALL');
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<OfficerStaffRecord[]>([]);
  const [keymenList, setKeymenList] = useState<KeymanRecord[]>([]);
  const [patrolList, setPatrolList] = useState<PatrolShiftRecord[]>([]);
  const [bridgeWatchmen, setBridgeWatchmen] = useState<BridgeWatchmanRecord[]>([]);
  const [levelCrossings, setLevelCrossings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenCardMenuId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

 const [selectedStaffForQR, setSelectedStaffForQR] = useState<OfficerStaffRecord | null>(null);
 const [selectedStaffForIdModal, setSelectedStaffForIdModal] = useState<UnifiedStaffModalData | null>(null);
 const [isScannerOpen, setIsScannerOpen] = useState(false);

 // Profile / Photo Upload Modal
 const [photoModalTarget, setPhotoModalTarget] = useState<{
 collection: 'officers_staff' | 'keymen' | 'patrol_shifts' | 'bridge_watchmen' | 'level_crossings';
 id: string;
 name: string;
 currentPhoto?: string;
 } | null>(null);
 const [profilePhotoModal, setProfilePhotoModal] = useState<{
 staffId: string;
 type: 'officer' | 'keyman' | 'patrol' | 'watchman';
 name: string;
 designation: string;
 currentPhoto?: string;
 } | null>(null);
 const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
 const photoFileInputRef = useRef<HTMLInputElement | null>(null);
 const selfieInputRef = useRef<HTMLInputElement | null>(null);
  // Client-Side Canvas Image Compression (< 40 KB JPEG)
  const compressStaffPhoto = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read photo file'));
      reader.readAsDataURL(file);
    });
  };

  // Quick Single-Assign Modal
 const [quickAssignTarget, setQuickAssignTarget] = useState<{
 type: 'patrol' | 'keyman';
 id: string;
 beatTitle: string;
 section: string;
 } | null>(null);
 const [assignFormData, setAssignFormData] = useState({
 selectedStaffId: '',
 name: '',
 awpoId: '',
 phone: '',
 restDay: 'Sunday'
 });

 // Master Advance Beat Allotment Modal
 const [isAdvanceAllotModalOpen, setIsAdvanceAllotModalOpen] = useState(false);
 const [advanceAllotData, setAdvanceAllotData] = useState({
 beatCode: 'SPD-01',
 shiftType: 'DAY' as 'DAY' | 'NIGHT',
 staffMode: 'EXISTING' as 'EXISTING' | 'NEW',
 selectedStaffId: '',
 name: '',
 awpoId: '',
 phone: '',
 partnerMode: 'EXISTING' as 'EXISTING' | 'NEW',
 partnerStaffId: '',
 partnerName: '',
 partnerAwpoId: '',
 partnerPhone: '',
 restDay: 'Sunday',
 fromKm: 1167.210,
 toKm: 1170.435,
 sectionCode: 'IMSD SMUN SPD-01 (KRJN - SMUN)'
 });

  // Google Translate Auto-Hindi Helper
  const translateNameToHindi = async (englishText: string) => {
    if (!englishText.trim()) return '';
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(englishText.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0][0][0];
        }
      }
    } catch (err) {
      console.warn('Auto translate warning:', err);
    }
    return '';
  };

  // Regular Add/Edit Staff Modal State
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffFormData, setStaffFormData] = useState<Record<string, any>>({
    name: '',
    nameHi: '',
    fatherName: '',
    post: 'Executive',
    role: 'STAFF',
    employmentType: 'REGULAR',
    email: '',
    phone: '',
    emergencyContact: '',
    headquarters: 'IMSD SMUN HQ',
    residence: '',
    assignedSection: 'KRJN-SMUN',
    awpoId: '',
    beatNo: 'SPD-01',
    beatFromTo: 'Km 1167.210 – 1170.435',
    lcNo: 'LC-151',
    bridgeNoOrKm: 'BR. 108 (ROR Rajpura Detour)',
    advanceBeatCode: '',
    lap: 30,
    cl: 8,
    photoUrl: ''
  });

 // Delete Confirmation Modal State
 const [deleteTarget, setDeleteTarget] = useState<{
 type: 'officer' | 'keyman' | 'patrol' | 'watchman';
 id: string;
 name: string;
 } | null>(null);

 const [staffViewMode, setStaffViewMode] = useState<'card' | 'list'>('card');

 const isSuperAdmin = role === 'SUPER_ADMIN';

  const normalizePhone = (phone?: string | null): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : '';
  };

  const normalizeName = (name?: string | null): string => {
    return (name || '').replace(/^(shri|mr|sh\.)\s+/i, '').trim().toLowerCase();
  };

  function deduplicateStaffList<T>(items: T[]): T[] {
    const seenKeys = new Set<string>();
    const seenPhones = new Set<string>();
    const result: T[] = [];

    for (const item of items) {
      const anyItem = item as any;
      const cleanName = normalizeName(anyItem.name || anyItem.patrolmanName);
      const cleanPhone = normalizePhone(anyItem.phone || anyItem.mobileNo || anyItem.mobile || anyItem.patrolmanPhone);
      const cleanId = (anyItem.id || anyItem.awpoId || anyItem.employeeId || anyItem.staffId || '').trim().toLowerCase();

      // Check phone deduplication
      if (cleanPhone && seenPhones.has(cleanPhone)) {
        continue; // duplicate by primary phone!
      }

      // Check name deduplication
      if (cleanName && seenKeys.has(cleanName)) {
        continue; // duplicate by name!
      }

      if (cleanPhone) seenPhones.add(cleanPhone);
      if (cleanName) seenKeys.add(cleanName);
      if (cleanId) seenKeys.add(cleanId);
      result.push(item);
    }
    return result;
  }

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [stf, kmn, ptl, bwm, lcs] = await Promise.all([
        db.getCollection<OfficerStaffRecord>('officers_staff'),
        db.getCollection<KeymanRecord>('keymen'),
        db.getCollection<PatrolShiftRecord>('patrol_shifts'),
        db.getCollection<BridgeWatchmanRecord>('bridge_watchmen'),
        db.getCollection<any>('level_crossings')
      ]);
      setStaffList(deduplicateStaffList(stf || []));
      setKeymenList(deduplicateStaffList(kmn || []));
      setPatrolList(deduplicateStaffList(ptl || []));
      setBridgeWatchmen(deduplicateStaffList(bwm || []));
      setLevelCrossings(lcs || []);
    } catch (err) {
      console.error('Failed to load staff records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🧹 Automated Duplicate Cleaner across all collections by Phone No. & Name
  const handleCleanupDuplicates = async () => {
    try {
      setIsLoading(true);
      const [stf, kmn, ptl, bwm, lcs] = await Promise.all([
        db.getCollection<OfficerStaffRecord>('officers_staff'),
        db.getCollection<KeymanRecord>('keymen'),
        db.getCollection<PatrolShiftRecord>('patrol_shifts'),
        db.getCollection<BridgeWatchmanRecord>('bridge_watchmen'),
        db.getCollection<LevelCrossingRecord>('level_crossings')
      ]);

      let removedCount = 0;
      const seenPhones = new Set<string>();
      const seenNames = new Set<string>();

      // 1. Deduplicate Keymen
      for (const k of (kmn || [])) {
        const phone = normalizePhone(k.mobileNo);
        const name = normalizeName(k.name);
        if ((phone && seenPhones.has(phone)) || (name && seenNames.has(name))) {
          await db.deleteDocument('keymen', k.id);
          removedCount++;
        } else {
          if (phone) seenPhones.add(phone);
          if (name) seenNames.add(name);
        }
      }

      // 2. Deduplicate Patrol Shifts
      for (const p of (ptl || [])) {
        if (p.patrolmanName && !p.patrolmanName.includes('Vacant')) {
          const phone = normalizePhone(p.patrolmanPhone);
          const name = normalizeName(p.patrolmanName);
          if ((phone && seenPhones.has(phone)) || (name && seenNames.has(name))) {
            await db.deleteDocument('patrol_shifts', p.id);
            removedCount++;
          } else {
            if (phone) seenPhones.add(phone);
            if (name) seenNames.add(name);
          }
        }
      }

      // 3. Deduplicate Bridge Watchmen
      for (const w of (bwm || [])) {
        const phone = normalizePhone(w.phone);
        const name = normalizeName(w.name);
        if ((phone && seenPhones.has(phone)) || (name && seenNames.has(name))) {
          await db.deleteDocument('bridge_watchmen', w.id);
          removedCount++;
        } else {
          if (phone) seenPhones.add(phone);
          if (name) seenNames.add(name);
        }
      }

      // 4. Deduplicate Officers & Staff
      for (const s of (stf || [])) {
        const phone = normalizePhone(s.phone);
        const name = normalizeName(s.name);
        if ((phone && seenPhones.has(phone)) || (name && seenNames.has(name))) {
          await db.deleteDocument('officers_staff', s.id);
          removedCount++;
        } else {
          if (phone) seenPhones.add(phone);
          if (name) seenNames.add(name);
        }
      }

      // 5. Deduplicate Gatemen inside Level Crossings
      for (const lc of (lcs || [])) {
        if (Array.isArray(lc.gatemen)) {
          const uniqueGatemen: any[] = [];
          for (const gm of lc.gatemen) {
            const phone = normalizePhone(gm.mobile);
            const name = normalizeName(gm.name);
            if ((phone && seenPhones.has(phone)) || (name && seenNames.has(name))) {
              removedCount++;
            } else {
              if (phone) seenPhones.add(phone);
              if (name) seenNames.add(name);
              uniqueGatemen.push(gm);
            }
          }
          if (uniqueGatemen.length !== lc.gatemen.length) {
            await db.updateDocument('level_crossings', lc.id, { gatemen: uniqueGatemen } as any);
          }
        }
      }

      await loadAllData();
      alert(`✅ Duplicate Staff Cleanup Successful!\n\nDeleted ${removedCount} duplicate personnel records matching by primary phone numbers and names.`);
    } catch (e: any) {
      console.error('Deduplication cleanup failed:', e);
      alert(`Cleanup failed: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ Universal Staff Edit Trigger for every section
  const handleOpenEditStaff = (staff: any, defaultType?: string) => {
    setEditingStaffId(staff.id || staff.staffId || staff.awpoId || staff.employeeId || staff.name);
    
    let inferredType = defaultType || staff.employmentType || 'REGULAR';
    if (!defaultType && !staff.employmentType) {
      if (staff.staffCategory === 'PERMANENT' || staff.role === 'SUPER_ADMIN') inferredType = 'REGULAR';
      else if (staff.staffCategory === 'OUTSOURCE') inferredType = 'MTS_OUTSOURCE';
      else if (staff.beatNoText || (staff.id && String(staff.id).startsWith('KM'))) inferredType = 'KEYMAN';
      else if (staff.shiftType === 'DAY' || (staff.beatCode && String(staff.beatCode).startsWith('SPD'))) inferredType = 'PATROLMAN_DAY';
      else if (staff.shiftType === 'NIGHT' || (staff.beatCode && String(staff.beatCode).startsWith('SPN'))) inferredType = 'PATROLMAN_NIGHT';
      else if (staff.gateNo || staff.lc_no || (staff.id && String(staff.id).startsWith('GTM'))) inferredType = 'GATEMAN';
      else if (staff.post?.includes('Watchman') || (staff.id && String(staff.id).startsWith('wm_'))) inferredType = 'BR_WATCHMAN';
    }

    setStaffFormData({
      name: staff.name || staff.patrolmanName || '',
      nameHi: staff.nameHi || '',
      fatherName: staff.fatherName || staff.father_name || '',
      post: staff.post || staff.designation || (inferredType === 'REGULAR' ? 'Executive' : (inferredType === 'MTS_OUTSOURCE' ? 'MTS' : (inferredType === 'KEYMAN' ? 'Keyman' : (inferredType === 'PATROLMAN_DAY' ? 'Day Patrolman' : (inferredType === 'PATROLMAN_NIGHT' ? 'Night Patrolman' : (inferredType === 'GATEMAN' ? 'Gateman' : 'Bridge Watchman')))))),
      role: staff.role || 'STAFF',
      employmentType: inferredType as any,
      email: staff.email || '',
      phone: staff.phone || staff.mobileNo || staff.mobile || staff.patrolmanPhone || '',
      emergencyContact: staff.emergencyContact || staff.otherMobileNo || staff.altMobile || '',
      headquarters: staff.headquarters || staff.residence || 'IMSD SMUN HQ',
      residence: staff.residence || staff.headquarters || '',
      assignedSection: staff.assignedSection || staff.sectionCode || staff.section || 'KRJN-SMUN',
      awpoId: staff.awpoId || staff.employeeId || staff.staffId || staff.patrolmanStaffId || '',
      beatNo: staff.beatNoText || staff.beatCode || (staff.beatNo ? `Beat ${staff.beatNo}` : ''),
      advanceBeatCode: staff.beatCode || '',
      beatFromTo: staff.beatFromTo || (staff.fromKm != null && staff.toKm != null ? `Km ${Number(staff.fromKm).toFixed(3)} – ${Number(staff.toKm).toFixed(3)}` : ''),
      lcNo: staff.lcNo || (staff.gateNo ? `LC-${staff.gateNo}` : ''),
      bridgeNoOrKm: staff.bridgeNoOrKm || (staff.km ? `Km ${staff.km}` : ''),
      photoUrl: staff.photoUrl || '',
      lap: staff.leaveBalance?.lap || 30,
      cl: staff.leaveBalance?.cl || 8
    });
    setIsStaffFormOpen(true);
  };

 useEffect(() => {
 loadAllData();
 const unsub = db.subscribe(() => {
 loadAllData();
 });
 return () => {
 unsub();
 };
 }, []);

 const gatemenList = useMemo(() => {
 const list: any[] = [];
 levelCrossings.forEach((lc) => {
 const gList = Array.isArray(lc.gatemen) ? lc.gatemen : [];
 const shifts = ['Shift 1 (08:00 - 16:00)', 'Shift 2 (16:00 - 24:00)', 'Shift 3 (00:00 - 08:00)'];
 gList.forEach((g: any, gIdx: number) => {
 list.push({
 id: `GTM-${lc.gateNo || lc.lc_no}-${g.id || gIdx}`,
 name: g.name,
 fatherName: g.fatherName || '-',
 awpoId: g.id || `AWPO-${46530 + gIdx}`,
 gateNo: lc.gateNo || lc.lc_no,
 gateKm: Number(lc.km || lc.chainage),
 section: lc.sectionCode || lc.section,
 classification: lc.classification || lc.class,
 tuv: lc.tuv,
 shift: shifts[gIdx % 3],
 mobile: g.mobile || '9478553153',
 isRelief: false,
 rgDetails: lc.rgDetails || lc.rg,
 residence: g.residence || 'Gate Lodge',
 photoUrl: g.photoUrl,
 qrCodeId: `RD-GTM-${lc.gateNo}-${g.id || gIdx}`,
 raw: g
 });
 });
 // Relief Gateman
 if (lc.rgDetails || lc.rg) {
 const rgStr = lc.rgDetails || lc.rg || '';
 const idMatch = rgStr.match(/\(?ID-?(\d+)/i) || rgStr.match(/(\d{5})/);
 const mobMatch = rgStr.match(/(\d{10})/);
 const cleanName = rgStr.replace(/\(.*?\)/g, '').replace(/Sh\.\s*/g, '').trim();
 list.push({
 id: `GTM-RG-${lc.gateNo || lc.lc_no}`,
 name: cleanName || 'Relief Gateman',
 fatherName: '-',
 awpoId: idMatch ? idMatch[1] : '48579',
 gateNo: lc.gateNo || lc.lc_no,
 gateKm: Number(lc.km || lc.chainage),
 section: lc.sectionCode || lc.section,
 classification: lc.classification || lc.class,
 tuv: lc.tuv,
 shift: 'Relief (RG Rotational)',
 mobile: mobMatch ? mobMatch[1] : '9478553153',
 isRelief: true,
 rgDetails: rgStr,
 residence: 'IMSD SMUN Base',
 qrCodeId: `RD-RG-${lc.gateNo}`,
 raw: { name: cleanName, mobile: mobMatch ? mobMatch[1] : '9478553153', post: 'Relief Gateman' }
 });
 }
 });
 return list;
 }, [levelCrossings]);

 const filteredGatemen = useMemo(() => {
 if (!searchQuery.trim()) return gatemenList;
 const q = searchQuery.toLowerCase().trim();
 return gatemenList.filter(
 g =>
 g.name.toLowerCase().includes(q) ||
 g.gateNo.toLowerCase().includes(q) ||
 g.awpoId.toLowerCase().includes(q) ||
 g.section.toLowerCase().includes(q) ||
 g.shift.toLowerCase().includes(q) ||
 g.mobile.includes(q)
 );
 }, [gatemenList, searchQuery]);

 const regularStaff = useMemo(() => {
 const list = staffList.filter(
 s =>
 s.employmentType === 'REGULAR' ||
 s.employmentType === 'DEPUTATION' ||
 s.role === 'SUPER_ADMIN' ||
 s.role === 'OFFICER'
 );
 if (!searchQuery.trim()) return list;
 const q = searchQuery.toLowerCase();
 return list.filter(
 s =>
 s.name.toLowerCase().includes(q) ||
 (s.nameHi || '').toLowerCase().includes(q) ||
 s.post.toLowerCase().includes(q)
 );
 }, [staffList, searchQuery]);

  const outsourcedStaff = useMemo(() => {
    let all = staffList.filter(s => {
      const isPerm = s.employmentType === 'REGULAR' || s.employmentType === 'DEPUTATION' || s.role === 'SUPER_ADMIN' || s.role === 'OFFICER' || s.staffCategory === 'PERMANENT';
      if (isPerm) return false;
      const postLower = (s.post || s.designation || '').toLowerCase();
      const empType = (s.employmentType || '').toUpperCase();
      const sectionLower = (s.assignedSection || s.headquarters || '').toLowerCase();
      // Exclude field Ex-Servicemen who belong to dedicated tabs (Keymen, Patrolmen, Gatemen, Bridge Watchmen)
      const isExServicemanPost = empType === 'KEYMAN' || empType.includes('PATROL') || empType === 'GATEMAN' || empType === 'BR_WATCHMAN' ||
        postLower.includes('keyman') || postLower.includes('patrol') || postLower.includes('gateman') || postLower.includes('gate') || postLower.includes('watchman') ||
        sectionLower.includes('spd') || sectionLower.includes('spn') || sectionLower.includes('beat no') || s.lcNo || s.bridgeNoOrKm ||
        (s.id && String(s.id).startsWith('KM-')) || (s.id && String(s.id).startsWith('gm_')) || (s.id && String(s.id).startsWith('wm_'));
      if (isExServicemanPost) return false;
      return true;
    });
    if (outsourceFilter === 'OFFICE') {
      all = all.filter(s => /computer|cleaner|sweeper|pump|office\s*boy|gardener|cook|driver|peon/i.test(s.post));
    } else if (outsourceFilter === 'GANG') {
      all = all.filter(s => /supervisor|mate|gangman|track\s*gang/i.test(s.post));
    } else if (outsourceFilter === 'MAINTAINER') {
      all = all.filter(s => /maintenance|maintainer|track\s*maintainer|mts/i.test(s.post));
    }
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        (s.nameHi || '').toLowerCase().includes(q) ||
        s.post.toLowerCase().includes(q) ||
        (s.awpoId || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q)
    );
  }, [staffList, outsourceFilter, searchQuery]);

 const filteredKeymen = useMemo(() => {
 if (!searchQuery.trim()) return keymenList;
 const q = searchQuery.toLowerCase();
 return keymenList.filter(
 k =>
 k.name.toLowerCase().includes(q) ||
 (k.beatNoText || '').toLowerCase().includes(q) ||
 (k.awpoId || '').toLowerCase().includes(q) ||
 (k.kmRange || '').toLowerCase().includes(q) ||
(k.residence || '').toLowerCase().includes(q) ||
 (k.mobileNo || '').includes(q)
 );
 }, [keymenList, searchQuery]);

 // Helper to extract numeric index from beat codes like SPD-01, SPD-001, SPD-1, PATROL-DAY-02, etc.
  const getBeatNumber = (code: string): number => {
    const m = (code || '').match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  };

  // Guaranteed 12 Day Patrol Beats (SPD-001 to SPD-012 / SPD-01 to SPD-12)
  const dayPatrols = useMemo(() => {
    const existingMap = new Map<string, PatrolShiftRecord>();
    const byNumberMap = new Map<number, PatrolShiftRecord>();

    patrolList.forEach(p => {
      const isDay = p.shiftType === 'DAY' || (p.beatCode || '').toUpperCase().startsWith('SPD') || (p.id || '').includes('DAY');
      if (isDay) {
        const code = (p.beatCode || '').toUpperCase().trim();
        if (code) {
          existingMap.set(code, p);
          const num = getBeatNumber(code);
          if (num > 0) byNumberMap.set(num, p);
        }
        const idNum = getBeatNumber(p.id);
        if (idNum > 0 && !byNumberMap.has(idNum)) {
          byNumberMap.set(idNum, p);
        }
      }
    });

    const fullList: PatrolShiftRecord[] = [];
    for (let i = 1; i <= 12; i++) {
      const beatCode3 = `SPD-${String(i).padStart(3, '0')}`;
      const beatCode2 = `SPD-${String(i).padStart(2, '0')}`;
      const found = existingMap.get(beatCode3) || existingMap.get(beatCode2) || existingMap.get(`SPD-${i}`) || byNumberMap.get(i);

      if (found) {
        fullList.push({
          ...found,
          beatCode: found.beatCode || beatCode3
        });
      } else {
        const routeInfo = DEFAULT_BEAT_ROUTES[beatCode2] || DEFAULT_BEAT_ROUTES[beatCode3] || {
          fromKm: 1167.210 + (i - 1) * 6.87,
          toKm: 1167.210 + i * 6.87,
          section: `IMSD SMUN ${beatCode2}`,
          shiftHoursDay: '15:00 - 23:00',
          shiftHoursNight: '23:00 - 07:00'
        };
        fullList.push({
          id: `PATROL-DAY-${String(i).padStart(2, '0')}`,
          beatCode: beatCode3,
          sectionCode: routeInfo.section,
          fromKm: routeInfo.fromKm,
          toKm: routeInfo.toKm,
          shiftCode: 'SHIFT_A_DAY',
          shiftHours: routeInfo.shiftHoursDay,
          shiftType: 'DAY',
          patrolType: 'SECURITY',
          patrolmanName: 'Vacant (Unassigned)',
          patrolmanStaffId: null,
          patrolmanPhone: null,
          patrolPartnerId: null,
          patrolPartnerName: null,
          pairId: beatCode3,
          isFilled: false,
          status: 'VACANT',
          restDay: 'Sunday',
          equipmentChecked: false,
          lastReportedKm: routeInfo.fromKm,
          lastReportedTime: '15:00',
          qrCodeId: `RD-${beatCode3}`,
          remarks: `Day Security Patrol • Beat ${beatCode3} • Vacant Beat Slot`
        });
      }
    }

    // Also include any extra custom day patrol shifts (e.g. SPD-13+)
    patrolList.forEach(p => {
      const num = getBeatNumber(p.beatCode || p.id);
      if (num > 12 && (p.shiftType === 'DAY' || (p.beatCode || '').startsWith('SPD'))) {
        if (!fullList.some(item => item.id === p.id)) {
          fullList.push(p);
        }
      }
    });

    if (!searchQuery.trim()) return fullList;
    const q = searchQuery.toLowerCase();
    return fullList.filter(
      p =>
        (p.patrolmanName || '').toLowerCase().includes(q) ||
        (p.beatCode || '').toLowerCase().includes(q) ||
        (p.sectionCode || '').toLowerCase().includes(q) ||
        (p.patrolmanPhone || '').includes(q)
    );
  }, [patrolList, searchQuery]);

  // Guaranteed 12 Night Patrol Beats (SPN-001 to SPN-012 / SPN-01 to SPN-12)
  const nightPatrols = useMemo(() => {
    const existingMap = new Map<string, PatrolShiftRecord>();
    const byNumberMap = new Map<number, PatrolShiftRecord>();

    patrolList.forEach(p => {
      const isNight = p.shiftType === 'NIGHT' || (p.beatCode || '').toUpperCase().startsWith('SPN') || (p.id || '').includes('NIGHT');
      if (isNight) {
        const code = (p.beatCode || '').toUpperCase().trim();
        if (code) {
          existingMap.set(code, p);
          const num = getBeatNumber(code);
          if (num > 0) byNumberMap.set(num, p);
        }
        const idNum = getBeatNumber(p.id);
        if (idNum > 0 && !byNumberMap.has(idNum)) {
          byNumberMap.set(idNum, p);
        }
      }
    });

    const fullList: PatrolShiftRecord[] = [];
    for (let i = 1; i <= 12; i++) {
      const beatCode3 = `SPN-${String(i).padStart(3, '0')}`;
      const beatCode2 = `SPN-${String(i).padStart(2, '0')}`;
      const found = existingMap.get(beatCode3) || existingMap.get(beatCode2) || existingMap.get(`SPN-${i}`) || byNumberMap.get(i);

      if (found) {
        fullList.push({
          ...found,
          beatCode: found.beatCode || beatCode3
        });
      } else {
        const routeInfo = DEFAULT_BEAT_ROUTES[beatCode2] || DEFAULT_BEAT_ROUTES[beatCode3] || {
          fromKm: 1167.210 + (i - 1) * 6.87,
          toKm: 1167.210 + i * 6.87,
          section: `IMSD SMUN ${beatCode2}`,
          shiftHoursDay: '15:00 - 23:00',
          shiftHoursNight: '23:00 - 07:00'
        };
        fullList.push({
          id: `PATROL-NIGHT-${String(i).padStart(2, '0')}`,
          beatCode: beatCode3,
          sectionCode: routeInfo.section,
          fromKm: routeInfo.fromKm,
          toKm: routeInfo.toKm,
          shiftCode: 'SHIFT_C_NIGHT',
          shiftHours: routeInfo.shiftHoursNight,
          shiftType: 'NIGHT',
          patrolType: 'SECURITY',
          patrolmanName: 'Vacant (Unassigned)',
          patrolmanStaffId: null,
          patrolmanPhone: null,
          patrolPartnerId: null,
          patrolPartnerName: null,
          pairId: beatCode3,
          isFilled: false,
          status: 'VACANT',
          restDay: 'Sunday',
          equipmentChecked: false,
          lastReportedKm: routeInfo.fromKm,
          lastReportedTime: '23:00',
          qrCodeId: `RD-${beatCode3}`,
          remarks: `Night Security Patrol • Beat ${beatCode3} • Vacant Beat Slot`
        });
      }
    }

    // Also include any extra custom night patrol shifts (e.g. SPN-13+)
    patrolList.forEach(p => {
      const num = getBeatNumber(p.beatCode || p.id);
      if (num > 12 && (p.shiftType === 'NIGHT' || (p.beatCode || '').startsWith('SPN'))) {
        if (!fullList.some(item => item.id === p.id)) {
          fullList.push(p);
        }
      }
    });

    if (!searchQuery.trim()) return fullList;
    const q = searchQuery.toLowerCase();
    return fullList.filter(
      p =>
        (p.patrolmanName || '').toLowerCase().includes(q) ||
        (p.patrolPartnerName || '').toLowerCase().includes(q) ||
        (p.beatCode || '').toLowerCase().includes(q) ||
        (p.sectionCode || '').toLowerCase().includes(q) ||
        (p.patrolmanPhone || '').includes(q)
    );
  }, [patrolList, searchQuery]);

 const vacantPatrols = useMemo(() => {
 const all = [...dayPatrols, ...nightPatrols];
 return all.filter(
 p => p.status === 'VACANT' || !p.isFilled || (p.patrolmanName || '').toLowerCase().includes('vacant')
 );
 }, [dayPatrols, nightPatrols]);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoModalTarget) return;

    try {
      setIsUploadingPhoto(true);
      const base64 = await compressStaffPhoto(file);
      if (base64) {
        if (photoModalTarget.collection === 'level_crossings') {
          const lcs = await db.getCollection<LevelCrossingRecord>('level_crossings');
          for (const lc of lcs) {
            if (Array.isArray(lc.gatemen)) {
              const idx = lc.gatemen.findIndex((g: any) => g.id === photoModalTarget.id || g.name === photoModalTarget.name);
              if (idx !== -1) {
                const updatedGatemen = [...lc.gatemen];
                updatedGatemen[idx] = { ...updatedGatemen[idx], photoUrl: base64 };
                await db.updateDocument('level_crossings', lc.id, { gatemen: updatedGatemen } as any, currentUser);
                break;
              }
            }
          }
          // Also update officers_staff if matching
          const offList = await db.getCollection<OfficerStaffRecord>('officers_staff');
          const matchOff = offList.find(o => o.name === photoModalTarget.name || o.awpoId === photoModalTarget.id);
          if (matchOff) {
            await db.updateDocument('officers_staff', matchOff.id, { photoUrl: base64 } as any, currentUser);
          }
        } else {
          await db.updateDocument(
            photoModalTarget.collection,
            photoModalTarget.id,
            { photoUrl: base64 } as any,
            currentUser
          );
        }

        // Also sync to users collection
        try {
          const usersList = await db.getCollection<any>('users');
          const matchUser = usersList.find(u => u.id === photoModalTarget.id || u.name === photoModalTarget.name || u.employeeId === photoModalTarget.id);
          if (matchUser) {
            await db.updateDocument('users', matchUser.id, { photoUrl: base64 } as any, currentUser);
          }
        } catch (e) {
          console.warn('User profile sync:', e);
        }

        await loadAllData();
        setPhotoModalTarget(null);
      }
    } catch (err: any) {
      alert(`Failed to save photo: ${err.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string, rawType?: string, rawId?: string) => {
    if (!window.confirm(`⚠️ CONFIRM PERMANENT DELETION:\n\nAre you sure you want to delete staff member "${name}" (${id}) from the database?`)) {
      return;
    }
    try {
      setIsLoading(true);
      let deleted = false;

      // 1. If explicit rawType and rawId provided, delete directly from source collection
      if (rawType && rawId) {
        try {
          if (rawType === 'level_crossings') {
            const lcs = await db.getCollection<LevelCrossingRecord>('level_crossings');
            for (const lc of lcs) {
              if (Array.isArray(lc.gatemen)) {
                const filtered = lc.gatemen.filter((g: any) => g.id !== rawId && g.id !== id && normalizeName(g.name) !== normalizeName(name));
                if (filtered.length !== lc.gatemen.length) {
                  await db.updateDocument('level_crossings', lc.id, { gatemen: filtered } as any, currentUser);
                  deleted = true;
                }
              }
            }
          } else {
            await db.deleteDocument(rawType as any, rawId, currentUser);
            deleted = true;
          }
        } catch (e) {
          console.warn(`Direct delete from ${rawType} failed:`, e);
        }
      }

      // 2. Try direct ID delete on all possible staff collections
      for (const col of ['officers_staff', 'keymen', 'patrol_shifts', 'bridge_watchmen'] as const) {
        try {
          await db.deleteDocument(col, id, currentUser);
          deleted = true;
        } catch (e) {}
      }

      // 3. Search collections if ID was synthetic or prefixed (e.g. AWPO-xxx, KM-x, pat_xxx)
      const cleanTargetName = normalizeName(name);
      const cleanTargetId = (id || '').toLowerCase();

      // Search keymen
      try {
        const kmList = await db.getCollection<KeymanRecord>('keymen');
        const kmMatch = kmList.find(k => k.id === id || (k.awpoId && k.awpoId.toLowerCase() === cleanTargetId) || normalizeName(k.name) === cleanTargetName);
        if (kmMatch) {
          await db.deleteDocument('keymen', kmMatch.id, currentUser);
          deleted = true;
        }
      } catch (e) {}

      // Search patrol shifts
      try {
        const patList = await db.getCollection<PatrolShiftRecord>('patrol_shifts');
        const patMatch = patList.find(p => p.id === id || p.beatCode === id || (p.patrolmanStaffId && p.patrolmanStaffId.toLowerCase() === cleanTargetId) || normalizeName(p.patrolmanName) === cleanTargetName);
        if (patMatch) {
          await db.deleteDocument('patrol_shifts', patMatch.id, currentUser);
          deleted = true;
        }
      } catch (e) {}

      // Search bridge watchmen
      try {
        const wmList = await db.getCollection<BridgeWatchmanRecord>('bridge_watchmen');
        const wmMatch = wmList.find(w => w.id === id || (w.awpoId && w.awpoId.toLowerCase() === cleanTargetId) || normalizeName(w.name) === cleanTargetName);
        if (wmMatch) {
          await db.deleteDocument('bridge_watchmen', wmMatch.id, currentUser);
          deleted = true;
        }
      } catch (e) {}

      // Search officers_staff
      try {
        const offList = await db.getCollection<OfficerStaffRecord>('officers_staff');
        const offMatch = offList.find(o => o.id === id || (o.awpoId && o.awpoId.toLowerCase() === cleanTargetId) || normalizeName(o.name) === cleanTargetName);
        if (offMatch) {
          await db.deleteDocument('officers_staff', offMatch.id, currentUser);
          deleted = true;
        }
      } catch (e) {}

      // Also clean up from level_crossings if it was a gateman
      try {
        const lcList = await db.getCollection<LevelCrossingRecord>('level_crossings');
        for (const lc of lcList) {
          if (Array.isArray(lc.gatemen)) {
            const filteredGatemen = lc.gatemen.filter((gm: any) => gm.id !== id && normalizeName(gm.name) !== cleanTargetName);
            if (filteredGatemen.length !== lc.gatemen.length) {
              await db.updateDocument('level_crossings', lc.id, { gatemen: filteredGatemen } as any, currentUser);
              deleted = true;
            }
          }
        }
      } catch (e) {}

      await loadAllData();
      alert(`✅ Staff record "${name}" deleted successfully!`);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePatrolShift = async (shift: PatrolShiftRecord) => {
    const isAssigned = shift.isFilled && shift.patrolmanName && !shift.patrolmanName.includes('Vacant');
    const msg = isAssigned
      ? `⚠️ UNASSIGN PATROLMAN / BEAT (${shift.beatCode}):\n\nAre you sure you want to unassign "${shift.patrolmanName}" from Beat ${shift.beatCode} and mark it as VACANT?`
      : `⚠️ DELETE PATROL BEAT (${shift.beatCode}):\n\nAre you sure you want to delete this patrol beat record?`;

    if (!window.confirm(msg)) return;

    try {
      // Clear assignment from staff record if matching
      const matchingStaff = staffList.find(s => s.name === shift.patrolmanName || s.awpoId === shift.patrolmanStaffId);
      if (matchingStaff) {
        await db.updateDocument('officers_staff', matchingStaff.id, {
          assignedSection: 'IMSD SMUN',
          advanceBeatCode: '',
          beatFromTo: ''
        } as any, currentUser);
      }

      // Mark beat as Vacant in patrol_shifts
      const vacantData = {
        ...shift,
        patrolmanName: 'Vacant Beat',
        patrolmanStaffId: '',
        patrolmanPhone: '-',
        patrolPartnerId: null,
        patrolPartnerName: null,
        isFilled: false,
        status: 'VACANT' as const,
        remarks: `${shift.beatCode} • Beat Vacant (Unassigned)`
      };

      const existing = patrolList.find(p => p.id === shift.id || p.beatCode === shift.beatCode);
      if (existing) {
        await db.updateDocument('patrol_shifts', existing.id, vacantData as any, currentUser);
      } else {
        await db.addDocument('patrol_shifts', vacantData as any, currentUser);
      }

      await loadAllData();
    } catch (err: any) {
      alert(`Unassign / Delete failed: ${err.message}`);
    }
  };

  const handleDeleteKeyman = async (keyman: KeymanRecord) => {
    if (!window.confirm(`⚠️ UNASSIGN KEYMAN BEAT (Beat ${keyman.beatNo}):\n\nAre you sure you want to unassign Keyman "${keyman.name}" from Beat ${keyman.beatNo}?`)) {
      return;
    }
    try {
      const vacantData = {
        ...keyman,
        name: 'Vacant (Unassigned)',
        awpoId: '',
        mobileNo: '-',
        residence: 'IMSD SMUN HQ'
      };
      await db.updateDocument('keymen', keyman.id, vacantData as any, currentUser);
      await loadAllData();
    } catch (err: any) {
      alert(`Keyman unassign failed: ${err.message}`);
    }
  };

 const handleQuickAssignSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!quickAssignTarget) return;

 if (!assignFormData.name.trim()) {
 alert('Please enter staff / ex-serviceman name');
 return;
 }

 try {
 if (quickAssignTarget.type === 'patrol') {
 const existing = patrolList.find(p => p.id === quickAssignTarget.id);
 const updates = {
 patrolmanName: assignFormData.name,
 patrolmanStaffId: assignFormData.awpoId || `AWPO-${Math.floor(10000 + Math.random() * 90000)}`,
 patrolmanPhone: assignFormData.phone,
 restDay: assignFormData.restDay,
 isFilled: true,
 status: 'ACTIVE' as const
 };
 if (existing) {
 await db.updateDocument('patrol_shifts', quickAssignTarget.id, updates as any, currentUser);
 } else {
 const routeInfo = DEFAULT_BEAT_ROUTES[quickAssignTarget.beatTitle] || {
 fromKm: 1167.210,
 toKm: 1170.435,
 section: quickAssignTarget.section,
 shiftHoursDay: '15:00 - 23:00',
 shiftHoursNight: '23:00 - 07:00'
 };
 const isNight = quickAssignTarget.beatTitle.startsWith('SPN');
 await db.addDocument(
 'patrol_shifts',
 {
 id: quickAssignTarget.id,
 beatCode: quickAssignTarget.beatTitle,
 sectionCode: routeInfo.section,
 fromKm: routeInfo.fromKm,
 toKm: routeInfo.toKm,
 shiftCode: isNight ? 'SHIFT_C_NIGHT' : 'SHIFT_A_DAY',
 shiftHours: isNight ? routeInfo.shiftHoursNight : routeInfo.shiftHoursDay,
 shiftType: isNight ? 'NIGHT' : 'DAY',
 patrolType: isNight ? 'COLD_WEATHER_NIGHT' : 'HOT_WEATHER',
 pairId: quickAssignTarget.beatTitle,
 equipmentChecked: true,
 lastReportedKm: routeInfo.fromKm,
 lastReportedTime: isNight ? '23:00' : '15:00',
 qrCodeId: `RD-${quickAssignTarget.beatTitle}`,
 remarks: `${quickAssignTarget.beatTitle} • Patrol Assigned`,
 ...updates
 } as any,
 currentUser
 );
 }
 }
 await loadAllData();
 setQuickAssignTarget(null);
 setAssignFormData({ selectedStaffId: '', name: '', awpoId: '', phone: '', restDay: 'Sunday' });
 } catch (err: any) {
 alert(`Assignment failed: ${err.message}`);
 }
 };

 // Open Advance Allotment Modal with pre-selected beat
 const openAdvanceAllotForBeat = (beatCode: string, shiftType: 'DAY' | 'NIGHT', currentPatrol?: PatrolShiftRecord) => {
 const route = DEFAULT_BEAT_ROUTES[beatCode] || {
 fromKm: 1167.210,
 toKm: 1170.435,
 section: `IMSD SMUN ${beatCode}`,
 shiftHoursDay: '15:00 - 23:00',
 shiftHoursNight: '23:00 - 07:00'
 };

 setAdvanceAllotData({
 beatCode: beatCode,
 shiftType: shiftType,
 staffMode: currentPatrol?.patrolmanStaffId ? 'EXISTING' : 'NEW',
 selectedStaffId: currentPatrol?.patrolmanStaffId || '',
 name: currentPatrol && currentPatrol.isFilled && currentPatrol.patrolmanName && !currentPatrol.patrolmanName.includes('Vacant') ? currentPatrol.patrolmanName : '',
 awpoId: currentPatrol?.patrolmanStaffId || '',
 phone: currentPatrol?.patrolmanPhone || '',
 partnerMode: currentPatrol?.patrolPartnerId ? 'EXISTING' : 'NEW',
 partnerStaffId: currentPatrol?.patrolPartnerId || '',
 partnerName: currentPatrol?.patrolPartnerName || '',
 partnerAwpoId: currentPatrol?.patrolPartnerId || '',
 partnerPhone: '',
 restDay: currentPatrol?.restDay || 'Sunday',
 fromKm: route.fromKm,
 toKm: route.toKm,
 sectionCode: route.section
 });
 setIsAdvanceAllotModalOpen(true);
 };

 const handleAdvanceBeatChange = (beatCode: string) => {
 const isNight = beatCode.startsWith('SPN');
 const route = DEFAULT_BEAT_ROUTES[beatCode] || {
 fromKm: 1167.210,
 toKm: 1170.435,
 section: `IMSD SMUN ${beatCode}`,
 shiftHoursDay: '15:00 - 23:00',
 shiftHoursNight: '23:00 - 07:00'
 };
 const existing = patrolList.find(p => p.beatCode === beatCode);

 setAdvanceAllotData(prev => ({
 ...prev,
 beatCode,
 shiftType: isNight ? 'NIGHT' : 'DAY',
 fromKm: route.fromKm,
 toKm: route.toKm,
 sectionCode: route.section,
 name: existing && existing.isFilled && existing.patrolmanName && !existing.patrolmanName.includes('Vacant') ? existing.patrolmanName : '',
 awpoId: existing?.patrolmanStaffId || '',
 phone: existing?.patrolmanPhone || '',
 partnerName: existing?.patrolPartnerName || '',
 partnerAwpoId: existing?.patrolPartnerId || '',
 restDay: existing?.restDay || 'Sunday'
 }));
 };

 const handleAdvanceStaffSelect = (staffId: string, isPartner: boolean = false) => {
 const staff = staffList.find(s => s.id === staffId);
 if (!staff) return;

 if (isPartner) {
 setAdvanceAllotData(prev => ({
 ...prev,
 partnerStaffId: staff.id,
 partnerName: staff.name,
 partnerAwpoId: staff.awpoId || staff.id,
 partnerPhone: staff.phone
 }));
 } else {
 setAdvanceAllotData(prev => ({
 ...prev,
 selectedStaffId: staff.id,
 name: staff.name,
 awpoId: staff.awpoId || staff.id,
 phone: staff.phone
 }));
 }
 };

 const handleAdvanceAllotSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!advanceAllotData.name.trim()) {
 alert('Please select or enter the Patrolman name');
 return;
 }

 try {
 const beatCode = advanceAllotData.beatCode;
 const isNight = advanceAllotData.shiftType === 'NIGHT';
 const docId = `PAT-${beatCode}`;
 const routeInfo = DEFAULT_BEAT_ROUTES[beatCode] || {
 fromKm: advanceAllotData.fromKm,
 toKm: advanceAllotData.toKm,
 section: advanceAllotData.sectionCode,
 shiftHoursDay: '15:00 - 23:00',
 shiftHoursNight: '23:00 - 07:00'
 };

 const existing = patrolList.find(p => p.beatCode === beatCode || p.id === docId);

 const recordData = {
 id: existing?.id || docId,
 beatCode: beatCode,
 sectionCode: routeInfo.section,
 fromKm: routeInfo.fromKm,
 toKm: routeInfo.toKm,
 shiftCode: isNight ? 'SHIFT_C_NIGHT' : 'SHIFT_A_DAY',
 shiftHours: isNight ? routeInfo.shiftHoursNight : routeInfo.shiftHoursDay,
 shiftType: isNight ? 'NIGHT' : 'DAY',
 patrolType: isNight ? 'COLD_WEATHER_NIGHT' : 'HOT_WEATHER',
 patrolmanName: advanceAllotData.name,
 patrolmanStaffId: advanceAllotData.awpoId || `AWPO-${Math.floor(10000 + Math.random() * 90000)}`,
 patrolmanPhone: advanceAllotData.phone,
 patrolPartnerId: isNight ? (advanceAllotData.partnerAwpoId || null) : null,
 patrolPartnerName: isNight ? (advanceAllotData.partnerName || null) : null,
 pairId: beatCode,
 isFilled: true,
 status: 'ACTIVE' as const,
 restDay: advanceAllotData.restDay,
 equipmentChecked: true,
 lastReportedKm: routeInfo.fromKm,
 lastReportedTime: isNight ? '23:00' : '15:00',
 qrCodeId: `RD-${beatCode}`,
 remarks: `${isNight ? 'Night' : 'Day'} Security Patrol • Beat: ${beatCode} (${routeInfo.section})`
 };

 if (existing) {
 await db.updateDocument('patrol_shifts', existing.id, recordData as any, currentUser);
 } else {
 await db.addDocument('patrol_shifts', recordData as any, currentUser);
 }

 // Also update officers_staff record for patrolman 1
 if (advanceAllotData.selectedStaffId) {
 const matchStaff = staffList.find(s => s.id === advanceAllotData.selectedStaffId);
 if (matchStaff) {
 await db.updateDocument('officers_staff', matchStaff.id, {
 assignedSection: beatCode,
 advanceBeatCode: beatCode,
 beatFromTo: routeInfo.section,
 phone: advanceAllotData.phone || matchStaff.phone
 } as any, currentUser);
 }
 } else if (advanceAllotData.name.trim()) {
 const matchStaff = staffList.find(s => s.name.trim().toLowerCase() === advanceAllotData.name.trim().toLowerCase());
 if (matchStaff) {
 await db.updateDocument('officers_staff', matchStaff.id, {
 assignedSection: beatCode,
 advanceBeatCode: beatCode,
 beatFromTo: routeInfo.section,
 phone: advanceAllotData.phone || matchStaff.phone
 } as any, currentUser);
 }
 }

 // Also update officers_staff record for patrol partner (night shift)
 if (isNight && advanceAllotData.partnerStaffId) {
 const matchPartner = staffList.find(s => s.id === advanceAllotData.partnerStaffId);
 if (matchPartner) {
 await db.updateDocument('officers_staff', matchPartner.id, {
 assignedSection: beatCode,
 advanceBeatCode: beatCode,
 beatFromTo: routeInfo.section,
 phone: advanceAllotData.partnerPhone || matchPartner.phone
 } as any, currentUser);
 }
 }

 await loadAllData();
 setIsAdvanceAllotModalOpen(false);
 } catch (err: any) {
 alert(`Advance beat allotment failed: ${err.message}`);
 }
 };

 const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const empType = staffFormData.employmentType;
      const isPerm = empType === 'REGULAR' || empType === 'DEPUTATION';

      const payload: any = {
        name: staffFormData.name.trim(),
        nameHi: staffFormData.nameHi?.trim() || '',
        fatherName: staffFormData.fatherName?.trim() || '',
        post: staffFormData.post || (isPerm ? 'Executive' : (empType === 'MTS_OUTSOURCE' ? 'MTS' : (empType === 'KEYMAN' ? 'Keyman' : (empType === 'PATROLMAN_DAY' ? 'Day Patrolman' : (empType === 'PATROLMAN_NIGHT' ? 'Night Patrolman' : (empType === 'GATEMAN' ? 'Gateman' : 'Bridge Watchman')))))),
        designation: staffFormData.post || 'Staff',
        role: staffFormData.role || (isPerm ? 'OFFICER' : 'STAFF'),
        employmentType: empType,
        staffCategory: isPerm ? 'PERMANENT' : (empType === 'MTS_OUTSOURCE' || empType === 'OFFICE_STAFF' ? 'OUTSOURCE' : 'EX_SERVICEMAN'),
        email: staffFormData.email || `${(staffFormData.awpoId || staffFormData.name).toLowerCase().replace(/\s+/g, '')}@dfcc.co.in`,
        phone: staffFormData.phone.trim(),
        emergencyContact: staffFormData.emergencyContact?.trim() || '',
        otherMobile: staffFormData.emergencyContact?.trim() || '',
        headquarters: staffFormData.headquarters || 'IMSD SMUN HQ',
        residence: staffFormData.residence?.trim() || '',
        assignedSection: staffFormData.assignedSection || staffFormData.headquarters || 'KRJN-SMUN',
        awpoId: staffFormData.awpoId?.trim() || null,
        beatNo: staffFormData.beatNo || staffFormData.advanceBeatCode || '',
        advanceBeatCode: staffFormData.beatNo || staffFormData.advanceBeatCode || '',
        beatFromTo: staffFormData.beatFromTo || '',
        lcNo: staffFormData.lcNo || '',
        bridgeNoOrKm: staffFormData.bridgeNoOrKm || '',
        restDay: staffFormData.restDay || 'Sunday',
        photoUrl: staffFormData.photoUrl || undefined,
        leaveBalance: {
          lap: Number(staffFormData.lap) || 30,
          lhap: 15,
          cl: Number(staffFormData.cl) || 8,
          rh: 2
        }
      };

      if (editingStaffId) {
        // 1. Update officers_staff
        try {
          await db.updateDocument('officers_staff', editingStaffId, payload, currentUser);
        } catch (err) {
          payload.id = editingStaffId;
          await db.addDocument('officers_staff', payload, currentUser).catch(() => {});
        }

        const isKeymanPost = /keyman/i.test(payload.post);
        const isPatrolPost = /patrol/i.test(payload.post);
        const isGatemanPost = /gateman|gate\s*man/i.test(payload.post);
        const isWatchmanPost = /watchman/i.test(payload.post);

        // If no longer Gateman, remove from level_crossings
        if (!isGatemanPost) {
          try {
            const lcs = await db.getCollection<LevelCrossingRecord>('level_crossings');
            for (const lc of lcs) {
              if (Array.isArray(lc.gatemen) && lc.gatemen.some((g: any) => g.id === editingStaffId || g.id === staffFormData.awpoId || normalizeName(g.name) === normalizeName(staffFormData.name))) {
                const filtered = lc.gatemen.filter((g: any) => g.id !== editingStaffId && g.id !== staffFormData.awpoId && normalizeName(g.name) !== normalizeName(staffFormData.name));
                await db.updateDocument('level_crossings', lc.id, { gatemen: filtered } as any, currentUser);
              }
            }
          } catch {}
        }

        // If no longer Keyman, remove from keymen
        if (!isKeymanPost) {
          try {
            const kms = await db.getCollection<any>('keymen');
            const matchKm = kms.find(k => k.id === editingStaffId || k.awpoId === staffFormData.awpoId || normalizeName(k.name) === normalizeName(staffFormData.name));
            if (matchKm) {
              await db.deleteDocument('keymen', matchKm.id, currentUser);
            }
          } catch {}
        }

        // If no longer Patrolman, unassign from patrol_shifts
        if (!isPatrolPost) {
          try {
            const pats = await db.getCollection<any>('patrol_shifts');
            const matchP = pats.find(p => p.id === editingStaffId || p.patrolmanStaffId === staffFormData.awpoId || normalizeName(p.patrolmanName) === normalizeName(staffFormData.name));
            if (matchP) {
              await db.updateDocument('patrol_shifts', matchP.id, { isFilled: false, patrolmanName: 'Unassigned', patrolmanStaffId: '', patrolmanPhone: '' }, currentUser);
            }
          } catch {}
        }

        // If no longer Watchman, remove from bridge_watchmen
        if (!isWatchmanPost) {
          try {
            const wms = await db.getCollection<any>('bridge_watchmen');
            const matchWm = wms.find(w => w.id === editingStaffId || w.awpoId === staffFormData.awpoId || normalizeName(w.name) === normalizeName(staffFormData.name));
            if (matchWm) {
              await db.deleteDocument('bridge_watchmen', matchWm.id, currentUser);
            }
          } catch {}
        }

        // 2. If Keyman, update/sync keymen collection
        if (empType === 'KEYMAN' || payload.post?.includes('Keyman') || editingStaffId.startsWith('KM') || editingStaffId.startsWith('km_')) {
          const beatNum = parseInt(staffFormData.beatNo?.replace(/\D/g, '') || '1') || 1;
          const kmPayload: any = {
            beatNo: beatNum,
            beatNoText: `Beat ${beatNum}`,
            name: staffFormData.name.trim(),
            awpoId: staffFormData.awpoId?.trim() || 'AWPO-88100',
            fatherName: staffFormData.fatherName?.trim() || '',
            mobileNo: staffFormData.phone.trim(),
            otherMobileNo: staffFormData.emergencyContact?.trim() || '',
            residence: staffFormData.residence?.trim() || 'IMSD SMUN HQ',
            kmRange: staffFormData.beatFromTo || `Km ${(1167.210 + (beatNum - 1) * 6).toFixed(3)} - ${(1173.210 + (beatNum - 1) * 6).toFixed(3)}`,
            fromKm: 1167.210 + (beatNum - 1) * 6,
            toKm: 1173.210 + (beatNum - 1) * 6,
            sectionCode: staffFormData.assignedSection || `IMSD SMUN Beat ${beatNum}`,
            photoUrl: staffFormData.photoUrl
          };
          const existingKm = keymenList.find(k => k.id === editingStaffId || k.awpoId === staffFormData.awpoId || k.beatNo === beatNum || normalizeName(k.name) === normalizeName(staffFormData.name));
          if (existingKm) {
            await db.updateDocument('keymen', existingKm.id, kmPayload, currentUser);
          } else {
            await db.addDocument('keymen', { id: `KM-${beatNum}`, ...kmPayload }, currentUser);
          }
        }

        // 3. If Patrolman, update/sync patrol_shifts collection
        if (empType === 'PATROLMAN_DAY' || empType === 'PATROLMAN_NIGHT' || payload.post?.includes('Patrol') || editingStaffId.startsWith('PAT') || editingStaffId.startsWith('pat_')) {
          const beatCode = staffFormData.beatNo || staffFormData.advanceBeatCode || 'SPD-01';
          const isNight = empType === 'PATROLMAN_NIGHT' || beatCode.startsWith('SPN');
          const route = DEFAULT_BEAT_ROUTES[beatCode] || {
            fromKm: 1167.210,
            toKm: 1170.435,
            section: `IMSD SMUN ${beatCode}`,
            shiftHoursDay: '15:00 - 23:00',
            shiftHoursNight: '23:00 - 07:00'
          };
          const patPayload: any = {
            beatCode,
            sectionCode: route.section,
            fromKm: route.fromKm,
            toKm: route.toKm,
            shiftCode: isNight ? 'SHIFT_C_NIGHT' : 'SHIFT_A_DAY',
            shiftHours: isNight ? route.shiftHoursNight : route.shiftHoursDay,
            shiftType: isNight ? 'NIGHT' : 'DAY',
            patrolType: isNight ? 'COLD_WEATHER_NIGHT' : 'HOT_WEATHER',
            patrolmanName: staffFormData.name.trim(),
            patrolmanStaffId: staffFormData.awpoId?.trim() || staffFormData.id,
            patrolmanPhone: staffFormData.phone.trim(),
            isFilled: true,
            status: 'ACTIVE',
            restDay: staffFormData.restDay || 'Sunday',
            remarks: staffFormData.residence || `${beatCode} • Active Patrol Duty`,
            photoUrl: staffFormData.photoUrl
          };
          const existingP = patrolList.find(p => p.id === editingStaffId || p.beatCode === beatCode || p.patrolmanStaffId === staffFormData.awpoId || normalizeName(p.patrolmanName) === normalizeName(staffFormData.name));
          if (existingP) {
            await db.updateDocument('patrol_shifts', existingP.id, patPayload, currentUser);
          } else {
            await db.addDocument('patrol_shifts', { id: `PAT-${beatCode}`, ...patPayload }, currentUser);
          }
        }

        // 4. If Gateman, update/sync level_crossings
        if (empType === 'GATEMAN' || payload.post?.includes('Gateman') || editingStaffId.startsWith('gm_') || editingStaffId.startsWith('GTM')) {
          const lcs = await db.getCollection<LevelCrossingRecord>('level_crossings');
          for (const lc of lcs) {
            if (Array.isArray(lc.gatemen)) {
              const idx = lc.gatemen.findIndex((g: any) => g.id === editingStaffId || g.id === staffFormData.awpoId || normalizeName(g.name) === normalizeName(staffFormData.name));
              if (idx !== -1) {
                const updatedGatemen = [...lc.gatemen];
                updatedGatemen[idx] = {
                  ...updatedGatemen[idx],
                  name: staffFormData.name.trim(),
                  id: staffFormData.awpoId?.trim() || updatedGatemen[idx].id,
                  mobile: staffFormData.phone.trim(),
                  residence: staffFormData.residence?.trim() || 'Gate Lodge',
                  photoUrl: staffFormData.photoUrl
                };
                await db.updateDocument('level_crossings', lc.id, { gatemen: updatedGatemen } as any, currentUser);
                break;
              }
            }
          }
        }

        // 5. If Bridge Watchman, update/sync bridge_watchmen
        if (empType === 'BR_WATCHMAN' || payload.post?.includes('Watchman') || editingStaffId.startsWith('wm_')) {
          const wmPayload: any = {
            name: staffFormData.name.trim(),
            awpoId: staffFormData.awpoId?.trim() || staffFormData.id,
            phone: staffFormData.phone.trim(),
            emergencyContact: staffFormData.emergencyContact?.trim() || '',
            location: staffFormData.bridgeNoOrKm || staffFormData.residence || 'ROR Rajpura Detour',
            bridgeNo: staffFormData.bridgeNoOrKm || 'BR. 108',
            photoUrl: staffFormData.photoUrl
          };
          const existingWm = bridgeWatchmen.find(w => w.id === editingStaffId || w.awpoId === staffFormData.awpoId || normalizeName(w.name) === normalizeName(staffFormData.name));
          if (existingWm) {
            await db.updateDocument('bridge_watchmen', existingWm.id, wmPayload, currentUser);
          } else {
            await db.addDocument('bridge_watchmen', { id: `wm_${Date.now()}`, ...wmPayload }, currentUser);
          }
        }

        // 6. Sync changes to user accounts in 'users' collection if exists
        try {
          const allUsers = await db.getCollection<any>('users');
          const matchUser = allUsers.find(u => u.id === editingStaffId || u.name === staffFormData.name || (staffFormData.awpoId && u.employeeId === staffFormData.awpoId));
          if (matchUser) {
            await db.updateDocument('users', matchUser.id, {
              name: staffFormData.name.trim(),
              designation: staffFormData.post || matchUser.designation,
              phone: staffFormData.phone.trim(),
              photoUrl: staffFormData.photoUrl || matchUser.photoUrl
            } as any, currentUser);
          }
        } catch (e) {
          console.warn('Users collection sync error:', e);
        }
      } else {
        // Register New Staff
        const newId = isPerm
          ? (staffFormData.awpoId ? staffFormData.awpoId : `EMP-${String(100800 + staffList.length)}`)
          : (staffFormData.awpoId ? (staffFormData.awpoId.startsWith('AWPO-') ? staffFormData.awpoId : `AWPO-${staffFormData.awpoId}`) : `AWPO-${String(88120 + staffList.length)}`);

        payload.id = newId;
        payload.email = staffFormData.email || `${newId.toLowerCase()}@dfcc.co.in`;
        payload.qrCodeId = `RD-${newId}`;
        payload.dateOfJoining = new Date().toISOString().split('T')[0];
        payload.bloodGroup = 'O+';

        await db.addDocument('officers_staff', payload, currentUser);

        if (empType === 'KEYMAN' && staffFormData.beatNo) {
          const beatNum = parseInt(staffFormData.beatNo.replace(/\D/g, '')) || 1;
          await db.addDocument('keymen', {
            id: `KM-${beatNum}`,
            beatNo: beatNum,
            beatNoText: `Beat ${beatNum}`,
            name: staffFormData.name.trim(),
            awpoId: staffFormData.awpoId?.trim() || newId,
            fatherName: staffFormData.fatherName?.trim() || '',
            mobileNo: staffFormData.phone.trim(),
            otherMobileNo: staffFormData.emergencyContact?.trim() || '',
            residence: staffFormData.residence?.trim() || 'IMSD SMUN HQ',
            kmRange: staffFormData.beatFromTo || '',
            sectionCode: `IMSD SMUN Beat ${beatNum}`
          }, currentUser);
        }
      }

      await loadAllData();
      setIsStaffFormOpen(false);
      setEditingStaffId(null);
      setStaffFormData({
        name: '',
        nameHi: '',
        fatherName: '',
        post: 'Executive',
        role: 'STAFF',
        employmentType: 'REGULAR',
        email: '',
        phone: '',
        emergencyContact: '',
        headquarters: 'IMSD SMUN HQ',
        residence: '',
        assignedSection: 'KRJN-SMUN',
        awpoId: '',
        beatNo: 'SPD-01',
        beatFromTo: 'Km 1167.210 – 1170.435',
        lcNo: 'LC-119',
        bridgeNoOrKm: 'Bridge 239 (Km 1174.500)',
        advanceBeatCode: '',
        restDay: 'Sunday',
        lap: 30,
        cl: 8,
        photoUrl: ''
      });
      alert(`✅ Staff details saved & synchronized across all rosters successfully!`);
    } catch (err: any) {
      alert(`Save staff failed: ${err.message}`);
    }
  };

 const getStationPillText = (hq?: string) => {
 if (!hq) return 'NEW SHAMBHU';
 const upper = hq.toUpperCase();
 if (upper.includes('SIRHIND') || upper.includes('NSIR') || upper.includes('SIR-HIND')) return 'NEW SIR-HIND';
 if (upper.includes('CHAWA') || upper.includes('CHAN')) return 'NEW CHAWA PAIL';
 if (upper.includes('KHANNA') || upper.includes('KNNN')) return 'NEW KHANNA';
 if (upper.includes('KALANOUR') || upper.includes('KRJN')) return 'NEW KALANOUR';
 if (upper.includes('SANNEHWAL') || upper.includes('SNL')) return 'NEW SANNEHWAL';
 return 'NEW SHAMBHU';
 };

 const exportKeymenCsv = () => {
 const headers = ['Beat Code', 'Keyman Name', "Father's Name", 'AWPO ID', 'Km Range', 'Contact No', 'Alt Contact', 'Residence', 'Rest Giver'];
 const rows = keymenList.map(k => [
 `"${k.beatNoText || k.beatNo}"`,
 `"${k.name}"`,
 `"${k.fatherName || ''}"`,
 `"${k.awpoId || k.id}"`,
 `"${k.kmRange || ''}"`,
 `"${k.mobileNo || ''}"`,
 `"${k.otherMobileNo || ''}"`,
 `"${(k.residence || '').replace(/\n/g, ' ')}"`,
 `"${k.rg || ''}"`
 ]);
 const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement('a');
 link.setAttribute('href', encodedUri);
 link.setAttribute('download', `DFCCIL_Keymen_Roster_${new Date().toISOString().split('T')[0]}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const allUnifiedStaff = useMemo(() => {
 const list: Array<{
 id: string;
 name: string;
 nameHi?: string;
 category: 'PERMANENT' | 'OUTSOURCE' | 'KEYMAN' | 'PATROLMAN' | 'GATEMAN' | 'WATCHMAN';
 categoryLabel: string;
 categoryBadgeClass: string;
 designation: string;
 empOrAwpoId: string;
 sectionOrBeat: string;
 phone: string;
 email?: string;
 photoUrl?: string;
 raw: any;
 rawType: 'officers_staff' | 'keymen' | 'patrol_shifts' | 'bridge_watchmen' | 'level_crossings';
 }> = [];

 // 1. Permanent Officers & Staff
 regularStaff.forEach(s => {
 list.push({
 id: s.id,
 name: s.name,
 nameHi: s.nameHi,
 category: 'PERMANENT',
 categoryLabel: 'Permanent Staff',
 categoryBadgeClass: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
 designation: s.post || s.role || 'Executive',
 empOrAwpoId: s.id.replace('EMP-', ''),
 sectionOrBeat: s.assignedSection || s.headquarters || 'IMSD SMUN',
 phone: s.phone || '',
 email: s.email,
 photoUrl: s.photoUrl,
 raw: s,
 rawType: 'officers_staff'
 });
 });

 // 2. Outsource Staff (MTS)
 outsourcedStaff.forEach(s => {
 list.push({
 id: s.id,
 name: s.name,
 nameHi: s.nameHi,
 category: 'OUTSOURCE',
 categoryLabel: 'Outsource / MTS',
 categoryBadgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
 designation: s.post || 'Track Maintainer / MTS',
 empOrAwpoId: s.awpoId || s.id,
 sectionOrBeat: s.headquarters || 'IMSD SMUN',
 phone: s.phone || '',
 email: s.email,
 photoUrl: s.photoUrl,
 raw: s,
 rawType: 'officers_staff'
 });
 });

 // 3. Keymen
 keymenList.forEach(k => {
 list.push({
 id: k.id,
 name: k.name,
 category: 'KEYMAN',
 categoryLabel: 'Keyman Beat',
 categoryBadgeClass: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
 designation: `Keyman (${k.beatNoText || k.beatNo || 'Beat'})`,
 empOrAwpoId: k.awpoId || k.staffId || '',
 sectionOrBeat: k.kmRange || `Km ${k.fromKm.toFixed(3)} – ${k.toKm.toFixed(3)}`,
 phone: k.mobileNo || '',
 photoUrl: k.photoUrl,
 raw: k,
 rawType: 'keymen'
 });
 });

 // 4. Patrolmen
 patrolList.forEach(p => {
 list.push({
 id: p.id,
 name: p.patrolmanName || 'Vacant Beat',
 category: 'PATROLMAN',
 categoryLabel: `Patrolman (${p.shiftType})`,
 categoryBadgeClass: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
 designation: `${p.shiftType === 'DAY' ? 'Day' : 'Night'} Patrol (${p.beatCode})`,
 empOrAwpoId: p.patrolmanStaffId || '',
 sectionOrBeat: p.route || `Km ${p.fromKm.toFixed(3)} – ${p.toKm.toFixed(3)}`,
 phone: p.patrolmanPhone || '',
 photoUrl: p.photoUrl,
 raw: p,
 rawType: 'patrol_shifts'
 });
 });

 // 5. Gatemen
 gatemenList.forEach(g => {
 list.push({
 id: g.id || `gm-${g.gateNo}-${g.name}`,
 name: g.name,
 category: 'GATEMAN',
 categoryLabel: `Gateman (LC ${g.gateNo})`,
 categoryBadgeClass: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
 designation: `LC Gateman (${g.shift || 'Shift'})`,
 empOrAwpoId: g.awpoId || '',
 sectionOrBeat: `LC ${g.gateNo} (${g.section || ''})`,
 phone: g.mobile || '',
 photoUrl: g.photoUrl,
 raw: g,
 rawType: 'level_crossings'
 });
 });

 // 6. Bridge Watchmen
 bridgeWatchmen.forEach(b => {
 list.push({
 id: b.id,
 name: b.name,
 category: 'WATCHMAN',
 categoryLabel: 'Bridge Watchman',
 categoryBadgeClass: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
 designation: `Watchman (${b.bridgeNo || 'BR. 108'})`,
 empOrAwpoId: b.awpoId || '',
 sectionOrBeat: b.location || 'ROR Rajpura Detour',
 phone: b.phone || '',
 photoUrl: b.photoUrl,
 raw: b,
 rawType: 'bridge_watchmen'
 });
 });

 return list;
 }, [regularStaff, outsourcedStaff, keymenList, patrolList, gatemenList, bridgeWatchmen]);

 const filteredUnifiedMasterStaff = useMemo(() => {
 let list = allUnifiedStaff;
 if (masterCategoryFilter !== 'ALL') {
 list = list.filter(s => s.category === masterCategoryFilter);
 }
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase().trim();
 list = list.filter(
 s =>
 s.name.toLowerCase().includes(q) ||
 (s.nameHi || '').toLowerCase().includes(q) ||
 s.designation.toLowerCase().includes(q) ||
 s.empOrAwpoId.toLowerCase().includes(q) ||
 s.sectionOrBeat.toLowerCase().includes(q) ||
 s.phone.includes(q)
 );
 }
 return list;
 }, [allUnifiedStaff, masterCategoryFilter, searchQuery]);

 const exportMasterStaffCsv = () => {
 const headers = ['Category', 'Name', 'Designation / Post', 'AWPO / Employee ID', 'Assigned Beat / Section', 'Mobile Number', 'Email'];
 const rows = filteredUnifiedMasterStaff.map(s => [
 `"${s.categoryLabel}"`,
 `"${s.name}"`,
 `"${s.designation}"`,
 `"${s.empOrAwpoId}"`,
 `"${s.sectionOrBeat}"`,
 `"${s.phone}"`,
 `"${s.email || ''}"`
 ]);
 const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
 const encodedUri = encodeURI(csvContent);
 const link = document.createElement('a');
 link.setAttribute('href', encodedUri);
 link.setAttribute('download', `DFCCIL_Master_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 return (
 <div className="space-y-6 animate-fadeIn pb-12">
 {vacantPatrols.length > 0 && (
 <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-300 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-lg">
 <ShieldAlert className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-black uppercase tracking-wider text-red-900">
 🚨 CRITICAL ALERT: {vacantPatrols.length} UNMANNED / VACANT BEAT(S)
 </span>
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
 Action Required
 </span>
 </div>
 <p className="text-xs text-slate-700 mt-0.5">
 Vacant beats detected in night/day patrol. Use alert mode to assign personnel immediately.
 </p>
 </div>
 </div>

 <button
 onClick={() => setActiveTab('patrol')}
 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg transition whitespace-nowrap self-start sm:self-center"
 >
 Review Vacant Beats ({vacantPatrols.length})
 </button>
 </div>
 )}

  {/* 📊 7 Interactive Staff Category KPIs with Automatic Linking (Master + 6 Sub-Rosters) */}
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
    {[
      {
        id: 'master' as const,
        title: 'Master Directory',
        subtitle: 'Global Edits & All Staff',
        count: allUnifiedStaff.length,
        icon: Users,
        bgClass: activeTab === 'master' ? 'bg-[#0f2b5c] text-white shadow-md ring-2 ring-cyan-400' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700',
        badgeBg: activeTab === 'master' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
      },
      {
        id: 'officers' as const,
        title: 'Permanent',
        subtitle: 'Permanent Staff',
        count: regularStaff.length,
        icon: Shield,
        bgClass: activeTab === 'officers' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400' : 'bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
        badgeBg: activeTab === 'officers' ? 'bg-blue-800 text-white' : 'bg-blue-200 dark:bg-blue-900 text-blue-950 dark:text-blue-100'
      },
      {
        id: 'outsourced' as const,
        title: 'Outsource MTS',
        subtitle: 'Outsource MTS & Field',
        count: outsourcedStaff.length,
        icon: Users,
        bgClass: activeTab === 'outsourced' ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400' : 'bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
        badgeBg: activeTab === 'outsourced' ? 'bg-emerald-800 text-white' : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100'
      },
      {
        id: 'patrol' as const,
        title: 'Patrolman',
        subtitle: 'Day / Night Patrols',
        count: patrolList.length,
        icon: Clock,
        bgClass: activeTab === 'patrol' ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400' : 'bg-purple-50/80 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800',
        badgeBg: activeTab === 'patrol' ? 'bg-purple-800 text-white' : 'bg-purple-200 dark:bg-purple-900 text-purple-950 dark:text-purple-100'
      },
      {
        id: 'keymen' as const,
        title: 'Keyman',
        subtitle: '18 Beat Sections',
        count: keymenList.length,
        icon: HardHat,
        bgClass: activeTab === 'keymen' ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400' : 'bg-cyan-50/80 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/40 text-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800',
        badgeBg: activeTab === 'keymen' ? 'bg-cyan-800 text-white' : 'bg-cyan-200 dark:bg-cyan-900 text-cyan-950 dark:text-cyan-100'
      },
      {
        id: 'gatemen' as const,
        title: 'Gateman',
        subtitle: 'LC Gates (7 Posts)',
        count: gatemenList.length,
        icon: Shield,
        bgClass: activeTab === 'gatemen' ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400' : 'bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800',
        badgeBg: activeTab === 'gatemen' ? 'bg-amber-800 text-white' : 'bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100'
      },
      {
        id: 'watchmen' as const,
        title: 'Br. Watchman',
        subtitle: 'Critical Bridges (3)',
        count: bridgeWatchmen.length,
        icon: Users,
        bgClass: activeTab === 'watchmen' ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400' : 'bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800',
        badgeBg: activeTab === 'watchmen' ? 'bg-indigo-800 text-white' : 'bg-indigo-200 dark:bg-indigo-900 text-indigo-950 dark:text-indigo-100'
      }
    ].map(kpi => {
      const Icon = kpi.icon;
      return (
        <button
          key={kpi.id}
          onClick={() => setActiveTab(kpi.id)}
          className={`p-2.5 rounded-2xl transition flex flex-col justify-between text-left cursor-pointer active:scale-95 ${kpi.bgClass}`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <Icon className="w-4 h-4 shrink-0" />
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${kpi.badgeBg}`}>
              {kpi.count}
            </span>
          </div>
          <div>
            <div className="text-xs font-black leading-tight truncate">{kpi.title}</div>
            <div className="text-[10px] opacity-80 leading-tight truncate">{kpi.subtitle}</div>
          </div>
        </button>
      );
    })}
  </div>

  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto select-none no-scrollbar">
    <button
      onClick={() => setActiveTab('master')}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
        activeTab === 'master'
          ? 'bg-[#0f2b5c] text-white shadow-md ring-1 ring-cyan-400'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
      }`}
    >
      <Users className="w-3.5 h-3.5 text-cyan-400" />
      <span>Master Directory ({allUnifiedStaff.length})</span>
    </button>

    <button
      onClick={() => setActiveTab('officers')}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
        activeTab === 'officers'
          ? 'bg-[#123b72] text-white shadow-md'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
      }`}
    >
      <Shield className="w-3.5 h-3.5" />
      <span>Permanent ({regularStaff.length})</span>
    </button>

    <button
      onClick={() => setActiveTab('outsourced')}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
        activeTab === 'outsourced'
          ? 'bg-[#123b72] text-white shadow-md'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
      }`}
    >
      <Users className="w-3.5 h-3.5" />
      <span>Outsource MTS ({outsourcedStaff.length})</span>
    </button>

    <button
      onClick={() => setActiveTab('keymen')}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
        activeTab === 'keymen'
          ? 'bg-[#123b72] text-white shadow-md'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
      }`}
    >
      <HardHat className="w-3.5 h-3.5" />
      <span>Keymen Beats ({keymenList.length})</span>
    </button>

    <button
      onClick={() => setActiveTab('gatemen')}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
        activeTab === 'gatemen'
          ? 'bg-[#123b72] text-white shadow-md'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
      }`}
    >
      <span className="text-xs">🚦</span>
      <span>Gatemen &amp; LC ({gatemenList.length})</span>
    </button>

    <button
      onClick={() => setActiveTab('patrol')}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
        activeTab === 'patrol'
          ? 'bg-[#123b72] text-white shadow-md'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>Patrolmen &amp; Shifts ({patrolList.length})</span>
    </button>

    <button
      onClick={() => setActiveTab('watchmen')}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
        activeTab === 'watchmen'
          ? 'bg-[#123b72] text-white shadow-md'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
      }`}
    >
      <span className="text-xs">🌉</span>
      <span>Bridge Watchmen ({bridgeWatchmen.length})</span>
    </button>

    <div className="ml-auto flex items-center gap-2 shrink-0">
      <button
        onClick={() => setIsScannerOpen(true)}
        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
      >
        <Scan className="w-3.5 h-3.5" />
        <span>Verify QR</span>
      </button>

      {isSuperAdmin && (
        <button
          onClick={() => {
            setEditingStaffId(null);
            setStaffFormData({
              name: '',
              nameHi: '',
              post: 'Track Maintainer',
              role: 'STAFF',
              employmentType: 'OUTSOURCED',
              email: '',
              phone: '',
              headquarters: 'IMSD SMUN',
              assignedSection: 'SMUN-SBJN',
              awpoId: '',
              advanceBeatCode: '',
              lap: 30,
              cl: 8,
              photoUrl: ''
            });
            setIsStaffFormOpen(true);
          }}
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Staff</span>
        </button>
      )}
    </div>
  </div>

  {/* ========================================================================= */}
  {/* 0. MASTER STAFF DIRECTORY FOR GLOBAL EDITS & AUDIT */}
  {/* ========================================================================= */}
  {activeTab === 'master' && (
    <div className="space-y-4 animate-fadeIn">
      {/* Master Toolbar & Category Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0f2b5c] dark:text-cyan-300 flex items-center gap-2">
              <span>📋</span>
              <span>Master Staff Directory — Unified Global Roster</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete centralized ledger of all {allUnifiedStaff.length} personnel across permanent, outsource, patrol, keyman, and gate posts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportMasterStaffCsv}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
              title="Download Complete Master Staff CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Export CSV</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setEditingStaffId(null);
                  setStaffFormData({
                    name: '',
                    nameHi: '',
                    post: 'Track Maintainer',
                    role: 'STAFF',
                    employmentType: 'REGULAR',
                    email: '',
                    phone: '',
                    headquarters: 'IMSD SMUN',
                    assignedSection: 'SMUN-SBJN',
                    awpoId: '',
                    advanceBeatCode: '',
                    lap: 30,
                    cl: 8,
                    photoUrl: ''
                  });
                  setIsStaffFormOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Register Staff</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
          <span className="text-slate-500 dark:text-slate-400 font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter:
          </span>
          {[
            { id: 'ALL', label: `All Personnel (${allUnifiedStaff.length})` },
            { id: 'PERMANENT', label: `Permanent (${regularStaff.length})` },
            { id: 'OUTSOURCE', label: `Outsource / MTS (${outsourcedStaff.length})` },
            { id: 'KEYMAN', label: `Keyman (${keymenList.length})` },
            { id: 'PATROLMAN', label: `Patrolman (${patrolList.length})` },
            { id: 'GATEMAN', label: `Gateman (${gatemenList.length})` },
            { id: 'WATCHMAN', label: `Bridge Watchman (${bridgeWatchmen.length})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setMasterCategoryFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                masterCategoryFilter === f.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Global Multi-Field Search Input */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Name, AWPO ID, Phone, Designation, Beat Code, Headquarters..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-inner font-medium"
          />
        </div>
      </div>

      {/* Master Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">Photo / ID</th>
                <th className="py-3 px-3">Name &amp; Designation</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">AWPO / EMP ID</th>
                <th className="py-3 px-3">Section / Beat</th>
                <th className="py-3 px-3">Mobile Contact</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {filteredUnifiedMasterStaff.length > 0 ? (
                filteredUnifiedMasterStaff.map((staff, idx) => (
                  <tr
                    key={`${staff.category}-${staff.id}-${idx}`}
                    className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition ${
                      idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    {/* Photo Thumbnail */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div
                        onClick={() =>
                          setPhotoModalTarget({
                            collection: staff.rawType === 'officers_staff' ? 'officers_staff' : staff.rawType === 'keymen' ? 'keymen' : staff.rawType === 'patrol_shifts' ? 'patrol_shifts' : 'bridge_watchmen',
                            id: staff.id,
                            name: staff.name,
                            currentPhoto: staff.photoUrl
                          })
                        }
                        className="w-9 h-9 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center justify-center text-slate-500 hover:opacity-80 transition relative group shadow-sm"
                        title="Click to update photo"
                      >
                        {staff.photoUrl ? (
                          <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold">{staff.name.slice(0, 2).toUpperCase()}</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </td>

                    {/* Name & Post */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white leading-tight">
                        {staff.name}
                      </div>
                      {staff.nameHi && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          {staff.nameHi}
                        </div>
                      )}
                      <div className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold truncate max-w-[180px]">
                        {staff.designation}
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${staff.categoryBadgeClass}`}>
                        {staff.categoryLabel}
                      </span>
                    </td>

                    {/* AWPO / EMP ID */}
                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {staff.empOrAwpoId || '-'}
                    </td>

                    {/* Section / Beat */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap max-w-[160px] truncate">
                      {staff.sectionOrBeat || 'IMSD SMUN'}
                    </td>

                    {/* Mobile */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {staff.phone ? (
                        <a
                          href={`tel:${staff.phone.replace(/[^0-9+]/g, '')}`}
                          className="font-mono text-blue-700 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 text-xs"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{staff.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 3-Dot Action Menu */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 relative">
                        {staff.phone && (
                          <a
                            href={`tel:${staff.phone.replace(/[^0-9+]/g, '')}`}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold transition"
                            title="Call Now"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedStaffForIdModal(staff.raw || staff)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                          title="View Official DFCCIL Staff ID Card"
                        >
                          <span>🪪 ID</span>
                        </button>

                        {/* 3-Dot Menu Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCardMenuId(openCardMenuId === `master-${staff.id}` ? null : `master-${staff.id}`);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                            title="More Actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* 3-Dot Popover Dropdown */}
                          {openCardMenuId === `master-${staff.id}` && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 text-xs text-left animate-fadeIn backdrop-blur-xl"
                            >
                              <button
                                onClick={() => {
                                  setSelectedStaffForIdModal(staff.raw || staff);
                                  setOpenCardMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                              >
                                <span>🪪</span>
                                <span>View ID Card</span>
                              </button>

                              <button
                                onClick={() => {
                                  setPhotoModalTarget({
                                    collection: staff.rawType === 'officers_staff' ? 'officers_staff' : staff.rawType === 'keymen' ? 'keymen' : staff.rawType === 'patrol_shifts' ? 'patrol_shifts' : 'bridge_watchmen',
                                    id: staff.id,
                                    name: staff.name,
                                    currentPhoto: staff.photoUrl
                                  });
                                  setOpenCardMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                              >
                                <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                                <span>Upload / Change Photo</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingStaffId(staff.id);
                                  setStaffFormData({
                                    name: staff.name,
                                    nameHi: staff.nameHi || '',
                                    post: staff.designation,
                                    role: 'STAFF',
                                    employmentType: staff.category === 'PERMANENT' ? 'REGULAR' : 'OUTSOURCED',
                                    email: staff.email || '',
                                    phone: staff.phone,
                                    headquarters: staff.sectionOrBeat,
                                    assignedSection: staff.sectionOrBeat,
                                    awpoId: staff.empOrAwpoId,
                                    advanceBeatCode: '',
                                    lap: 30,
                                    cl: 8,
                                    photoUrl: staff.photoUrl || ''
                                  });
                                  setIsStaffFormOpen(true);
                                  setOpenCardMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center gap-2 font-semibold"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Global Edit Details</span>
                              </button>

                              {isSuperAdmin && (
                                <button
                                  onClick={() => {
                                    handleDeleteStaff(staff.id, staff.name, staff.rawType, staff.raw?.id);
                                    setOpenCardMenuId(null);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Record</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No staff records found matching "{searchQuery}" in category "{masterCategoryFilter}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {activeTab === 'officers' && (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0f2b5c] dark:text-cyan-300 flex items-center gap-2">
            <span>🏆</span>
            <span>DFCCIL IMSD-SMUN Official Contact Directory</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Total {regularStaff.length} Officers &amp; Staff (Permanent / Regular)
          </span>
        </div>

        {/* View Switcher Toggle: 2-Grid Card View vs Tabular List View */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto shadow-sm">
          <button
            type="button"
            onClick={() => setStaffViewMode('card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              staffViewMode === 'card'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🪪 Card View (2-Grid)</span>
          </button>
          <button
            type="button"
            onClick={() => setStaffViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              staffViewMode === 'list'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📋 List / Tabular View</span>
          </button>
        </div>
      </div>

      {staffViewMode === 'card' ? (
        /* 2-Column Grid Layout (Wide & Legible, No Name Truncation) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regularStaff.map(staff => {
            const stationPill = getStationPillText(staff.headquarters);
            return (
              <div
                key={staff.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition">
                        {staff.name}
                      </h3>
                      {staff.nameHi && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">{staff.nameHi}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 tracking-wide shrink-0">
                      {stationPill}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Designation</span>
                      <p className="text-xs text-blue-700 dark:text-cyan-400 font-black tracking-tight uppercase mt-0.5">
                        {staff.post || staff.role}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Emp ID</span>
                      <p className="text-xs font-mono font-black text-slate-900 dark:text-slate-200 mt-0.5">
                        {staff.id.replace('EMP-', '')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs">
                    {staff.phone && (
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-blue-600 dark:text-cyan-400 text-sm">📞</span>
                        <a href={`tel:${staff.phone.replace(/[^0-9+]/g, '')}`} className="hover:underline font-mono">
                          {staff.phone}
                        </a>
                      </div>
                    )}
                    {staff.email && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 truncate text-[11px]">
                        <span className="text-slate-400">✉️</span>
                        <a href={`mailto:${staff.email}`} className="truncate hover:underline">
                          {staff.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <a
                      href={`tel:${staff.phone?.replace(/[^0-9+]/g, '')}`}
                      className="flex-1 py-2 px-3 bg-[#1a4b8c] hover:bg-[#123668] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedStaffForIdModal(staff)}
                      className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                      title="View Official DFCCIL Staff ID Card"
                    >
                      <span>🪪 ID Card</span>
                    </button>
                  </div>

                  {/* 3-Dot Action Menu */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCardMenuId(openCardMenuId === `officer-${staff.id}` ? null : `officer-${staff.id}`);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition"
                      title="More Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {openCardMenuId === `officer-${staff.id}` && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 bottom-full mb-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 text-xs text-left animate-fadeIn backdrop-blur-xl"
                      >
                        <button
                          onClick={() => {
                            setPhotoModalTarget({
                              collection: 'officers_staff',
                              id: staff.id,
                              name: staff.name,
                              currentPhoto: staff.photoUrl
                            });
                            setOpenCardMenuId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                        >
                          <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                          <span>Upload Photo</span>
                        </button>

                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingStaffId(staff.id);
                                setStaffFormData({
                                  name: staff.name,
                                  nameHi: staff.nameHi || '',
                                  post: staff.post,
                                  role: staff.role,
                                  employmentType: staff.employmentType,
                                  email: staff.email,
                                  phone: staff.phone,
                                  headquarters: staff.headquarters,
                                  assignedSection: staff.assignedSection,
                                  awpoId: staff.awpoId || '',
                                  advanceBeatCode: '',
                                  lap: staff.leaveBalance?.lap || 30,
                                  cl: staff.leaveBalance?.cl || 8,
                                  photoUrl: staff.photoUrl || ''
                                });
                                setIsStaffFormOpen(true);
                                setOpenCardMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center gap-2 font-semibold"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </button>

                            <button
                              onClick={() => {
                                handleDeleteStaff(staff.id, staff.name);
                                setOpenCardMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Officer</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tabular List View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#e8f1fb] dark:bg-slate-800 text-[#0f2b5c] dark:text-slate-200 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5 text-center">Sr.</th>
                  <th className="p-3.5">Officer / Staff Name</th>
                  <th className="p-3.5">Designation (पद)</th>
                  <th className="p-3.5">Emp ID</th>
                  <th className="p-3.5">Headquarters / Section</th>
                  <th className="p-3.5">Contact Phone</th>
                  <th className="p-3.5">Official Email</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {regularStaff.map((staff, idx) => {
                  const stationPill = getStationPillText(staff.headquarters);
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{staff.name}</div>
                        {staff.nameHi && <div className="text-[11px] text-slate-500 dark:text-slate-400">{staff.nameHi}</div>}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-blue-700 dark:text-cyan-300">{staff.post || staff.role}</span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {staff.id.replace('EMP-', '')}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {stationPill}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        {staff.phone ? (
                          <a href={`tel:${staff.phone.replace(/[^0-9+]/g, '')}`} className="text-blue-600 dark:text-cyan-400 hover:underline">
                            {staff.phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {staff.email ? (
                          <a href={`mailto:${staff.email}`} className="text-blue-600 dark:text-cyan-400 hover:underline">
                            {staff.email}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStaffForIdModal(staff)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 rounded-lg text-xs font-bold transition"
                            title="View Official DFCCIL Staff ID Card"
                          >
                            <span>🪪 ID</span>
                          </button>
                          <a
                            href={`tel:${staff.phone?.replace(/[^0-9+]/g, '')}`}
                            className="p-1.5 bg-[#1a4b8c] hover:bg-[#123668] text-white rounded-lg transition"
                            title="Call Officer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )}

  {activeTab === 'outsourced' && (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {outsourcedStaff.map(staff => (
          <div
            key={staff.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 p-5 rounded-2xl space-y-3 transition shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{staff.name}</h3>
                  {staff.nameHi && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{staff.nameHi}</p>}
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold truncate">{staff.post}</p>
                </div>

                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-mono font-bold rounded shrink-0">
                  {staff.awpoId || staff.id}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Unit:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{staff.headquarters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Mobile:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{staff.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 flex-1">
                <a
                  href={`tel:${staff.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex-1 py-1.5 px-2.5 bg-[#1a4b8c] hover:bg-[#123668] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedStaffForIdModal(staff)}
                  className="flex-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-sm"
                  title="View Official DFCCIL Staff ID Card"
                >
                  <span>🪪 ID</span>
                </button>
              </div>

              {/* 3-Dot Action Menu */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenCardMenuId(openCardMenuId === `outsource-${staff.id}` ? null : `outsource-${staff.id}`);
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition"
                  title="More Options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {openCardMenuId === `outsource-${staff.id}` && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 bottom-full mb-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 text-xs text-left animate-fadeIn backdrop-blur-xl"
                  >
                    <button
                      onClick={() => {
                        setPhotoModalTarget({
                          collection: 'officers_staff',
                          id: staff.id,
                          name: staff.name,
                          currentPhoto: staff.photoUrl
                        });
                        setOpenCardMenuId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                      <span>Upload Photo</span>
                    </button>

                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setEditingStaffId(staff.id);
                            setStaffFormData({
                              name: staff.name,
                              nameHi: staff.nameHi || '',
                              post: staff.post,
                              role: staff.role,
                              employmentType: staff.employmentType,
                              email: staff.email,
                              phone: staff.phone,
                              headquarters: staff.headquarters,
                              assignedSection: staff.assignedSection,
                              awpoId: staff.awpoId || '',
                              advanceBeatCode: '',
                              lap: staff.leaveBalance?.lap || 30,
                              cl: staff.leaveBalance?.cl || 8,
                              photoUrl: staff.photoUrl || ''
                            });
                            setIsStaffFormOpen(true);
                            setOpenCardMenuId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center gap-2 font-semibold"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>

                        <button
                          onClick={() => {
                            handleDeleteStaff(staff.id, staff.name);
                            setOpenCardMenuId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold"
                        >
                  <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Staff</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {activeTab === 'keymen' && (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-black text-[#0f2b5c] dark:text-blue-300 flex items-center gap-2">
            <span>🏆</span>
            <span>Keymen Roster &amp; Beat Jurisdictions (18 Beats)</span>
          </h3>
          <button
            type="button"
            onClick={exportKeymenCsv}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Keyman Name, Beat No, Km, District..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#e8f1fb] dark:bg-slate-800 text-[#0f2b5c] dark:text-blue-300 font-black border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3">BEAT CODE</th>
                <th className="py-3 px-3">KEYMAN NAME</th>
                <th className="py-3 px-3">FATHER'S NAME</th>
                <th className="py-3 px-3">AWPO ID</th>
                <th className="py-3 px-3">KM RANGE</th>
                <th className="py-3 px-3">CONTACT NO.</th>
                <th className="py-3 px-3">ALT CONTACT</th>
                <th className="py-3 px-3">RESIDENCE &amp; DISTRICT</th>
                <th className="py-3 px-3">REST GIVER INFO</th>
                <th className="py-3 px-3 text-right">ID CARD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {filteredKeymen.map((km, idx) => (
                <tr key={km.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/60' : 'bg-slate-50/60 dark:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-slate-800/60'}>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedStaffForIdModal(km)}
                      className="inline-block px-2 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-bold rounded text-xs font-mono hover:bg-blue-100 transition text-left"
                      title="Click to view full ID card"
                    >
                      {km.beatNoText?.replace('Beat No. ', 'K-0') || km.id}
                    </button>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{km.beatNoText}</div>
                  </td>
                  <td className="py-3 px-3 font-bold whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedStaffForIdModal(km)}
                      className="text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left font-bold"
                      title="Click to view full DFCCIL Staff ID"
                    >
                      {km.name}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{km.fatherName || '-'}</td>
                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">{km.awpoId?.replace('AWPO-', '') || km.id}</td>
                  <td className="py-3 px-3 font-mono text-xs whitespace-nowrap text-slate-700 dark:text-slate-300">{km.kmRange || '-'}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <a href={`tel:${km.mobileNo}`} className="text-blue-700 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                      <span className="text-xs">📞</span>
                      <span>{km.mobileNo}</span>
                    </a>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">{km.otherMobileNo || '-'}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={km.residence}>
                    {km.residence || '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 text-xs">
                    {km.rg || '-'}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 relative">
                      <button
                        type="button"
                        onClick={() => setSelectedStaffForIdModal(km)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 border border-blue-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm transition active:scale-95"
                        title="View Official DFCCIL Staff ID"
                      >
                        <span>🪪 ID</span>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCardMenuId(openCardMenuId === `keyman-${km.id}` ? null : `keyman-${km.id}`);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg transition"
                          title="More Actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openCardMenuId === `keyman-${km.id}` && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 text-xs text-left animate-fadeIn backdrop-blur-xl"
                          >
                            <button
                              onClick={() => {
                                setSelectedStaffForIdModal(km);
                                setOpenCardMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                            >
                              <span>🪪</span>
                              <span>View ID Card</span>
                            </button>

                            <button
                              onClick={() => {
                                setPhotoModalTarget({
                                  collection: 'keymen',
                                  id: km.id,
                                  name: km.name,
                                  currentPhoto: km.photoUrl
                                });
                                setOpenCardMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-800 dark:text-slate-200 flex items-center gap-2"
                            >
                              <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                              <span>Upload Photo</span>
                            </button>

                            {isSuperAdmin && (
                              <button
                                onClick={() => {
                                  handleDeleteKeyman(km);
                                  setOpenCardMenuId(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Unassign Beat</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

 {/* ------------------------------------------------------------------------- */}
 {/* 4. GATEMEN & LEVEL CROSSINGS (18 GATEMEN ACROSS 5 LC GATES) */}
 {/* ------------------------------------------------------------------------- */}
 {activeTab === 'gatemen' && (
 <div className="space-y-6 animate-fadeIn">
 {/* Header Bar & Search */}
 <div className="bg-gradient-to-r from-blue-50 via-red-50/40 to-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="text-xl">🚦</span>
 <h3 className="text-base sm:text-lg font-black text-[#0f2b5c]">
 DFCCIL IMSD-SMUN Gatemen &amp; Level Crossings Roster
 </h3>
 </div>
 <p className="text-xs text-slate-600">
 18 Gatemen deployed across 5 Level Crossing Gates (3 Shifts × 8 Hours + Relief Gatemen).
 </p>
 <div className="flex flex-wrap items-center gap-2 pt-1">
 <span className="px-2.5 py-1 bg-red-100 border border-red-300 text-red-900 rounded-lg text-[11px] font-bold">
 5 Manned Gates
 </span>
 <span className="px-2.5 py-1 bg-blue-100 border border-blue-300 text-blue-900 rounded-lg text-[11px] font-bold">
 15 Regular Shift Gatemen
 </span>
 <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-[11px] font-bold">
 3 Relief Gatemen (RG)
 </span>
 </div>
 </div>

 <div className="relative w-full sm:w-72">
 <input
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Search Gateman, Gate No, AWPO ID..."
 className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
 />
 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
 </div>
 </div>

 {/* Level Crossings 5 Gates Overview Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {levelCrossings.map((lc) => (
 <div
 key={lc.id}
 className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-3"
 >
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-black">
 LC {lc.gateNo || lc.lc_no}
 </span>
 <span className="text-xs font-mono font-bold text-slate-700">
 Km {Number(lc.km || lc.chainage).toFixed(3)}
 </span>
 </div>
 <p className="text-xs font-semibold text-slate-600 mt-1">
 {lc.sectionCode || lc.section || `${lc.fromStn}–${lc.toStn}`} • Class: {lc.classification || lc.class || 'Special'}
 </p>
 </div>
 <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
 Interlocked
 </span>
 </div>

 <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-1">
 <div className="flex justify-between">
 <span>TVU Count:</span>
 <span className="font-mono font-bold text-slate-700">{Number(lc.tuv || 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between">
 <span>Road Name:</span>
 <span className="font-medium text-slate-700 truncate max-w-[150px]">{lc.roadName || 'PWD / State Highway'}</span>
 </div>
 </div>

 {/* Shift Roster for this Gate */}
 <div className="space-y-1.5 pt-1 border-t border-slate-100">
 <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Shift Roster:</div>
 {(lc.gatemen || []).map((gm: any, idx: number) => {
 const shiftLabels = ['Morning (08-16)', 'Evening (16-24)', 'Night (00-08)'];
 return (
 <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded-lg">
 <div>
 <span className="text-[10px] font-bold text-blue-600 block">{shiftLabels[idx % 3]}:</span>
 <span className="font-bold text-slate-900">{gm.name}</span>
 <span className="text-[10px] text-slate-500 font-mono ml-1">({gm.id})</span>
 </div>
 <a
 href={`tel:${gm.mobile || '9478553153'}`}
 className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm"
 >
 <Phone className="w-3 h-3" />
 <span>Call</span>
 </a>
 </div>
 );
 })}
 {lc.rgDetails && (
 <div className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
 <span className="font-bold">RG: </span>
 <span>{lc.rgDetails}</span>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* Complete Gatemen Table */}
 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="text-base">📋</span>
 <h4 className="text-sm font-bold text-[#0f2b5c]">
 Individual Gateman Personnel Directory ({filteredGatemen.length})
 </h4>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs border-collapse">
 <thead>
 <tr className="bg-[#e8f1fb] text-[#0f2b5c] font-black border-b border-slate-200">
 <th className="py-3 px-3">GATE NO</th>
 <th className="py-3 px-3">KM</th>
 <th className="py-3 px-3">GATEMAN NAME</th>
 <th className="py-3 px-3">AWPO ID</th>
 <th className="py-3 px-3">ASSIGNED SHIFT</th>
 <th className="py-3 px-3">SECTION</th>
 <th className="py-3 px-3">MOBILE NO</th>
 <th className="py-3 px-3">RELIEF (RG)</th>
 <th className="py-3 px-3 text-right">ACTION</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
 {filteredGatemen.map((gm, idx) => (
 <tr
 key={gm.id || idx}
 className={
 idx % 2 === 0
 ? 'bg-white hover:bg-blue-50/50'
 : 'bg-slate-50/60 hover:bg-blue-50/50'
 }
 >
 <td className="py-3 px-3 whitespace-nowrap">
 <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded font-bold font-mono">
 LC {gm.gateNo}
 </span>
 </td>
 <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
 {Number(gm.gateKm).toFixed(3)}
 </td>
 <td className="py-3 px-3 font-bold whitespace-nowrap">
 <button
 type="button"
 onClick={() => setSelectedStaffForIdModal(gm)}
 className="text-slate-900 hover:text-blue-600 hover:underline text-left font-bold"
 title="Click to view full DFCCIL Staff ID"
 >
 {gm.name}
 </button>
 </td>
 <td className="py-3 px-3 font-mono text-slate-700">
 {gm.awpoId?.replace('AWPO-', '') || '-'}
 </td>
 <td className="py-3 px-3 whitespace-nowrap">
 <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 gm.isRelief
 ? 'bg-amber-100 text-amber-800'
 : 'bg-blue-100 text-blue-800'
 }`}>
 {gm.shift}
 </span>
 </td>
 <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
 {gm.section}
 </td>
 <td className="py-3 px-3 whitespace-nowrap">
 <a
 href={`tel:${gm.mobile}`}
 className="text-blue-700 font-bold hover:underline flex items-center gap-1"
 >
 <span className="text-xs">📞</span>
 <span>{gm.mobile}</span>
 </a>
 </td>
 <td className="py-3 px-3 text-slate-600 text-xs truncate max-w-[150px]" title={gm.rgDetails}>
 {gm.rgDetails || '-'}
 </td>
 <td className="py-3 px-3 text-right whitespace-nowrap">
 <div className="inline-flex items-center gap-1.5 relative">
 <a
 href={`tel:${gm.mobile}`}
 className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold inline-flex items-center gap-1 shadow-sm"
 >
 <Phone className="w-3 h-3" />
 <span>Call</span>
 </a>
 <button
 type="button"
 onClick={() => setSelectedStaffForIdModal(gm)}
 className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 border border-blue-200 rounded text-xs font-bold inline-flex items-center gap-1 shadow-sm"
 >
 <span>🪪 ID</span>
 </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* ------------------------------------------------------------------------- */}
  {/* 5. BRIDGE WATCHMEN (BR. 108 ROR RAJPURA DETOUR) */}
  {/* ------------------------------------------------------------------------- */}
  {activeTab === 'watchmen' && (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-50 via-amber-50/40 to-slate-50 dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌉</span>
            <h3 className="text-base sm:text-lg font-black text-[#0f2b5c] dark:text-blue-300">
              DFCCIL IMSD-SMUN Bridge Watchmen Directory
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Special 24x7 Structure Surveillance &amp; Waterway Monitoring on Bridge 108 (ROR Rajpura Detour Line).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bridgeWatchmen.map(bm => (
          <div
            key={bm.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{bm.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  AWPO ID: <span className="font-bold text-slate-700 dark:text-slate-300">{bm.awpoId}</span>
                </p>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg font-bold text-xs">
                {bm.bridgeNo || 'BR. 108'}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400">
                <span>📞 Primary:</span>
                <a href={`tel:${bm.phone}`} className="hover:underline">{bm.phone}</a>
              </div>
              {bm.emergencyContact && (
                <div className="flex items-center gap-1.5">
                  <span>📱 Alt / Emergency:</span>
                  <a href={`tel:${bm.emergencyContact}`} className="hover:underline font-mono">{bm.emergencyContact}</a>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px] pt-1">
                <span>📍 Location:</span>
                <span className="truncate">{bm.location || 'ROR Rajpura Detour'}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href={`tel:${bm.phone}`}
                className="flex-1 py-2 bg-[#1a4b8c] hover:bg-[#123668] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedStaffForIdModal(bm)}
                className="flex-1 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <span>🪪</span>
                <span>Staff ID</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

 {activeTab === 'patrol' && (
 <div className="space-y-6">
 {/* Patrol Duty Roster Toolbar & Stats */}
 <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="text-xl">🛡️</span>
 <h3 className="text-base sm:text-lg font-black text-[#0f2b5c]">
 DFCCIL Track Security &amp; Patrol Jurisdictions (88.679 Km)
 </h3>
 </div>
 <p className="text-xs text-slate-600">
 12 Day Beats (SPD-01 to SPD-12) &amp; 12 Night Beats (SPN-01 to SPN-12). Automatic missing beat detection with advance staff allotment.
 </p>
 <div className="flex flex-wrap items-center gap-2 pt-1">
 <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
 <Sun className="w-3.5 h-3.5 text-amber-600" />
 <span>12 Day Beats (SPD-01 – 12)</span>
 </span>
 <span className="px-2.5 py-1 bg-indigo-100 border border-indigo-300 text-indigo-900 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
 <Moon className="w-3.5 h-3.5 text-indigo-500" />
 <span>12 Night Beats (SPN-01 – 12)</span>
 </span>
 <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 ${
 vacantPatrols.length > 0
 ? 'bg-red-100 text-red-900 border-red-300 animate-pulse'
 : 'bg-emerald-100 text-emerald-900 border-emerald-300'
 }`}>
 <ShieldAlert className="w-3.5 h-3.5" />
 <span>{vacantPatrols.length} Vacant Beats</span>
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => openAdvanceAllotForBeat('SPD-01', 'DAY')}
 className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 transform active:scale-95"
 >
 <Plus className="w-4 h-4" />
 <span>⚡ Advance Beat Allotment</span>
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. Day Security Patrol Table (SPD-01 to SPD-12) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-lg text-amber-600 dark:text-amber-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0f2b5c] dark:text-white">
                  Day Security Patrol (Shift 1: 15:00 to 23:00 hrs)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  12 Total Beats • Single Patrolman per Beat
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-mono font-bold">
              9/12 Filled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#e8f1fb] dark:bg-slate-800 text-[#0f2b5c] dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-2.5">BEAT</th>
                  <th className="py-2.5 px-2.5">PATROLMAN NAME</th>
                  <th className="py-2.5 px-2.5">ROUTE / JURISDICTION</th>
                  <th className="py-2.5 px-2.5">CONTACT</th>
                  <th className="py-2.5 px-2.5">REST DAY</th>
                  <th className="py-2.5 px-2.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {[
                  { beatCode: 'SPD-001', name: 'Vacant (Unassigned)', staffId: '', route: 'SMUN-SBJN\nKm 1162.000 — 1170.000', contact: '-', restDay: 'Wednesday', isVacant: true },
                  { beatCode: 'SPD-002', name: 'Gurdeep Singh', staffId: '14570', route: 'SMUN-SBJN\nKm 1170.000 — 1178.000', contact: '9876588667', restDay: 'Thursday', isVacant: false },
                  { beatCode: 'SPD-003', name: 'Surjeet Singh', staffId: '11272', route: 'SMUN-SBJN\nKm 1178.000 — 1186.000', contact: '9501277242', restDay: 'Friday', isVacant: false },
                  { beatCode: 'SPD-004', name: 'Ravinder Singh', staffId: '16869', route: 'SMUN-SBJN\nKm 1186.000 — 1194.000', contact: '9463088814', restDay: 'Saturday', isVacant: false },
                  { beatCode: 'SPD-005', name: 'Baljinder Singh', staffId: '15598', route: 'SMUN-SBJN\nKm 1194.000 — 1202.000', contact: '7460849679', restDay: 'Sunday', isVacant: false },
                  { beatCode: 'SPD-006', name: 'Vacant (Unassigned)', staffId: '', route: 'B 1202/6 to C 1210/5\nKm 1202.060 — 1210.050', contact: '-', restDay: 'Sunday', isVacant: true },
                  { beatCode: 'SPD-007', name: 'Chamkor Singh', staffId: '16201', route: 'SMUN-SBJN\nKm 1210.000 — 1218.000', contact: '7986000467', restDay: 'Tuesday', isVacant: false },
                  { beatCode: 'SPD-008', name: 'Sukhchain Singh', staffId: '11272', route: 'SMUN-SBJN\nKm 1218.000 — 1226.000', contact: '8054012678', restDay: 'Wednesday', isVacant: false },
                  { beatCode: 'SPD-009', name: 'Harwinder Singh', staffId: '16608', route: 'SMUN-SBJN\nKm 1226.000 — 1233.000', contact: '8429171981', restDay: 'Thursday', isVacant: false },
                  { beatCode: 'SPD-010', name: 'Amritpal Singh', staffId: '14678', route: 'SMUN-SBJN\nKm 1233.000 — 1241.000', contact: '8812006561', restDay: 'Friday', isVacant: false },
                  { beatCode: 'SPD-011', name: 'Baljeet Singh', staffId: '11272', route: 'SMUN-SBJN\nKm 1241.000 — 1249.000', contact: '8427463892', restDay: 'Saturday', isVacant: false },
                  { beatCode: 'SPD-012', name: 'Vacant (Unassigned)', staffId: '', route: 'B 1170/9 to C 1178/4\nKm 1170.090 — 1178.040', contact: '-', restDay: 'Sunday', isVacant: true }
                ].map((pt, idx) => {
                  const isVacant = pt.isVacant;
                  return (
                    <tr key={pt.beatCode} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900 hover:bg-amber-50/30 dark:hover:bg-slate-800/50' : 'bg-slate-50/70 dark:bg-slate-950/40 hover:bg-amber-50/30 dark:hover:bg-slate-800/50'}>
                      <td className="py-2.5 px-2.5 font-mono font-bold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs border ${
                          isVacant
                            ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                            : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                        }`}>
                          {pt.beatCode}
                        </span>
                      </td>
                      <td className={`py-2.5 px-2.5 font-bold whitespace-nowrap ${isVacant ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {isVacant ? (
                          <span className="flex items-center gap-1">🚨 Vacant (Unassigned)</span>
                        ) : (
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedStaffForIdModal({
                                name: pt.name,
                                awpoId: pt.staffId,
                                mobileNo: pt.contact,
                                post: 'Day Security Patrolman',
                                beatCode: pt.beatCode,
                                sectionCode: 'SMUN-SBJN',
                                fromKm: 1167.210,
                                toKm: 1249.720,
                                category: 'Ex-Serviceman'
                              })}
                              className="text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left font-bold"
                              title="Click to view full DFCCIL Staff ID"
                            >
                              {pt.name}
                            </button>
                            {pt.staffId && (
                              <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 font-normal">
                                {pt.staffId}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300 text-[11px] whitespace-nowrap">
                        <div className="font-semibold">{pt.route.split('\n')[0]}</div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{pt.route.split('\n')[1] || ''}</div>
                      </td>
                      <td className="py-2.5 px-2.5 font-mono whitespace-nowrap">
                        {pt.contact !== '-' ? (
                          <a href={`tel:${pt.contact}`} className="text-blue-700 dark:text-cyan-300 hover:underline flex items-center gap-1 font-bold">
                            <span>📞</span>
                            <span>{pt.contact}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs">
                        {pt.restDay}
                      </td>
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                        {isVacant ? (
                          <button
                            onClick={() => openAdvanceAllotForBeat(pt.beatCode, 'DAY')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-red-600 hover:bg-red-700 text-white shadow-sm transition inline-flex items-center gap-1 animate-pulse"
                          >
                            <span>🚨</span>
                            <span>Assign Beat</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedStaffForIdModal({
                                name: pt.name,
                                awpoId: pt.staffId,
                                mobileNo: pt.contact,
                                post: 'Day Security Patrolman',
                                beatCode: pt.beatCode,
                                sectionCode: 'SMUN-SBJN',
                                fromKm: 1167.210,
                                toKm: 1249.720,
                                category: 'Ex-Serviceman'
                              })}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition inline-flex items-center gap-0.5"
                              title="View Official DFCCIL Staff ID"
                            >
                              <span>🪪</span>
                              <span>ID</span>
                            </button>
                            <button
                              onClick={() => openAdvanceAllotForBeat(pt.beatCode, 'DAY')}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition inline-flex items-center gap-1"
                              title="Re-allot Beat"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Re-allot</span>
                            </button>
                            <button
                              onClick={() => handleDeletePatrolShift({ id: `DAY-${pt.beatCode}`, beatCode: pt.beatCode } as any)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition inline-flex items-center gap-1"
                              title="Unassign Patrolman & Mark Beat Vacant"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Unassign</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Night Security Patrol Table - SPN (24 Total Slots: 4 Vacant • 20 Active) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0f2b5c] dark:text-white">
                  Night Security Patrol - SPN (Shift 2: 23:00 to 07:00 hrs)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  12 Night Beats (SPN-001 to SPN-012) • 24 Personnel (2-Man Patrol Pair per Beat)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-cyan-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-mono font-bold self-start sm:self-auto">
              24 Total Slots (4 Vacant • 20 Active)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#e8f1fb] dark:bg-slate-800 text-[#0f2b5c] dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3">Sr No</th>
                  <th className="py-2.5 px-3">Beat No.</th>
                  <th className="py-2.5 px-3">Patrolman Name</th>
                  <th className="py-2.5 px-3">Route Name</th>
                  <th className="py-2.5 px-3">Mobile Number</th>
                  <th className="py-2.5 px-3 text-right">ID Card Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {[
                  { srNo: 1, beatCode: 'SPN-001', name: '[Vacant Beat Slot]', route: 'B 1162/17 to C 1170/16', mobile: 'Vecant Beat', isVacant: true },
                  { srNo: 2, beatCode: 'SPN-001', name: '[Vacant Beat Slot]', route: 'B 1162/17 to C 1170/16', mobile: 'Vecant Beat', isVacant: true },
                  { srNo: 3, beatCode: 'SPN-002', name: 'Dharminder Singh', staffId: '11500', route: 'B 1170/16 to C 1178/12', mobile: '9466303713', isVacant: false },
                  { srNo: 4, beatCode: 'SPN-002', name: 'Balkar Singh', staffId: '11501', route: 'B 1170/16 to C 1178/12', mobile: '9896486583', isVacant: false },
                  { srNo: 5, beatCode: 'SPN-003', name: 'Rajinder Singh', staffId: '14690', route: 'B 1178/12 to C 1186/9', mobile: '7973074232', isVacant: false },
                  { srNo: 6, beatCode: 'SPN-003', name: 'Vikramjit Singh', staffId: '14691', route: 'B 1178/12 to C 1186/9', mobile: '9478790749', isVacant: false },
                  { srNo: 7, beatCode: 'SPN-004', name: 'Dharminder Singh', staffId: '11500', route: 'B 1186/9 to C 1194/7', mobile: '9877978448', isVacant: false },
                  { srNo: 8, beatCode: 'SPN-004', name: 'Rachhpal Singh', staffId: '11502', route: 'B 1186/9 to C 1194/7', mobile: '7087370322', isVacant: false },
                  { srNo: 9, beatCode: 'SPN-005', name: '[Vacant Beat Slot]', route: 'B 1194/7 to C 1202/6', mobile: 'Vecant Beat', isVacant: true },
                  { srNo: 10, beatCode: 'SPN-005', name: '[Vacant Beat Slot]', route: 'B 1194/7 to C 1202/6', mobile: 'Vecant Beat', isVacant: true },
                  { srNo: 11, beatCode: 'SPN-006', name: 'Amarjit Singh', staffId: '14643', route: 'B 1202/6 to C 1210/5', mobile: '7004563174', isVacant: false },
                  { srNo: 12, beatCode: 'SPN-006', name: 'Baljit Singh', staffId: '14644', route: 'B 1202/6 to C 1210/5', mobile: '9530822519', isVacant: false },
                  { srNo: 13, beatCode: 'SPN-007', name: 'Santok Singh', staffId: '14650', route: 'B 1210/5 to C 1218/2', mobile: '9592458167', isVacant: false },
                  { srNo: 14, beatCode: 'SPN-007', name: 'Gurjant Singh', staffId: '14651', route: 'B 1210/5 to C 1218/2', mobile: '8283848434', isVacant: false },
                  { srNo: 15, beatCode: 'SPN-008', name: 'Gurpreet Singh', staffId: '14660', route: 'B 1218/2 to C 1226/1', mobile: '8847400008', isVacant: false },
                  { srNo: 16, beatCode: 'SPN-008', name: 'Gurjit Singh', staffId: '14661', route: 'B 1218/2 to C 1226/1', mobile: '8360358775', isVacant: false },
                  { srNo: 17, beatCode: 'SPN-009', name: 'Tarsem Singh', staffId: '14670', route: 'B 1226/1 to C 1233/16', mobile: '8427122355', isVacant: false },
                  { srNo: 18, beatCode: 'SPN-009', name: 'Harjinder Singh', staffId: '14671', route: 'B 1226/1 to C 1233/16', mobile: '9463843762', isVacant: false },
                  { srNo: 19, beatCode: 'SPN-010', name: 'Yadwinder Singh', staffId: '14680', route: 'B 1233/16 to C 1241/15', mobile: '9501572141', isVacant: false },
                  { srNo: 20, beatCode: 'SPN-010', name: 'Sukhwinder Singh', staffId: '14681', route: 'B 1233/16 to C 1241/15', mobile: '7973475062', isVacant: false },
                  { srNo: 21, beatCode: 'SPN-011', name: 'Jagroop Singh', staffId: '14695', route: 'B 1241/15 to C 1249/15', mobile: '8146492292', isVacant: false },
                  { srNo: 22, beatCode: 'SPN-011', name: 'Harpreet Singh', staffId: '14696', route: 'B 1241/15 to C 1249/15', mobile: '8847593020', isVacant: false },
                  { srNo: 23, beatCode: 'SPN-012', name: 'Salamundin Singh', staffId: '14700', route: 'B 1170/9 to C 1178/4', mobile: '9417986390', isVacant: false },
                  { srNo: 24, beatCode: 'SPN-012', name: 'Nirbhay Singh', staffId: '14701', route: 'B 1170/9 to C 1178/4', mobile: '8872359476', isVacant: false }
                ].map((pt) => {
                  const isVacant = pt.isVacant;
                  return (
                    <tr
                      key={`${pt.beatCode}-${pt.srNo}`}
                      className={
                        isVacant
                          ? 'bg-[#ffff00] dark:bg-yellow-950/60 font-bold text-slate-950 dark:text-yellow-100 border-y border-amber-300 dark:border-amber-700'
                          : pt.srNo % 2 === 0
                          ? 'bg-white dark:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-slate-800/50'
                          : 'bg-slate-50/70 dark:bg-slate-950/40 hover:bg-indigo-50/40 dark:hover:bg-slate-800/50'
                      }
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-center">
                        {pt.srNo}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black whitespace-nowrap">
                        {pt.beatCode}
                      </td>
                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                        {isVacant ? (
                          <span className="italic text-slate-900 dark:text-yellow-200">{pt.name}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedStaffForIdModal({
                              name: pt.name,
                              awpoId: pt.staffId || '',
                              mobileNo: pt.mobile,
                              post: 'Night Security Patrolman',
                              beatCode: pt.beatCode,
                              sectionCode: 'SMUN-SBJN',
                              fromKm: 1167.210,
                              toKm: 1249.720,
                              category: 'Ex-Serviceman'
                            })}
                            className="text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-cyan-300 hover:underline text-left font-bold"
                            title="Click to view full DFCCIL Staff ID"
                          >
                            {pt.name}
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        {pt.route}
                      </td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        {isVacant ? (
                          <span className="font-bold text-red-700 dark:text-red-300">{pt.mobile}</span>
                        ) : (
                          <a href={`tel:${pt.mobile}`} className="text-blue-700 dark:text-cyan-300 hover:underline flex items-center gap-1 font-bold">
                            <span>📞</span>
                            <span>{pt.mobile}</span>
                          </a>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isVacant ? (
                          <button
                            onClick={() => openAdvanceAllotForBeat(pt.beatCode, 'NIGHT')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black shadow-sm transition inline-flex items-center gap-1"
                          >
                            <span>Assign Beat</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedStaffForIdModal({
                              name: pt.name,
                              awpoId: pt.staffId || '',
                              mobileNo: pt.mobile,
                              post: 'Night Security Patrolman',
                              beatCode: pt.beatCode,
                              sectionCode: 'SMUN-SBJN',
                              fromKm: 1167.210,
                              toKm: 1249.720,
                              category: 'Ex-Serviceman'
                            })}
                            className="px-3 py-1 bg-[#1a365d] hover:bg-[#0f2b5c] dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm transition inline-flex items-center gap-1"
                          >
                            <span>🪪</span>
                            <span>View ID Card</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )}

  <input
    type="file"
    ref={photoFileInputRef}
    accept="image/*"
    onChange={handlePhotoFileChange}
    className="hidden"
  />
 <input
 type="file"
 ref={selfieInputRef}
 accept="image/*"
 capture="user"
 onChange={handlePhotoFileChange}
 className="hidden"
 />

 {/* 📸 Photo / Selfie Upload Modal */}
 {photoModalTarget && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
 <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
 <h3 className="text-base font-bold text-slate-900">Photo / Selfie for {photoModalTarget.name}</h3>
 <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-slate-100 border-2 border-blue-400 flex items-center justify-center">
 {photoModalTarget.currentPhoto ? (
 <img src={photoModalTarget.currentPhoto} alt="" className="w-full h-full object-cover" />
 ) : (
 <Users className="w-10 h-10 text-slate-400" />
 )}
 </div>
 <div className="space-y-2">
 <button
 onClick={() => selfieInputRef.current?.click()}
 disabled={isUploadingPhoto}
 className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow"
 >
 <Camera className="w-4 h-4" />
 <span>Take Live Selfie (Camera)</span>
 </button>
 <button
 onClick={() => photoFileInputRef.current?.click()}
 disabled={isUploadingPhoto}
 className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center justify-center gap-1.5"
 >
 <Upload className="w-4 h-4" />
 <span>Upload from Gallery / Files</span>
 </button>
 <button
 onClick={() => setPhotoModalTarget(null)}
 className="w-full py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold"
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 )}

 {/* 👥 Add/Edit Staff Modal with Google Translation and Exact Role Fields */}
 {isStaffFormOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-scaleUp">
 <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
 <div className="flex items-center gap-2">
 <Users className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
 <span className="text-base font-black text-slate-900 dark:text-white">
 {editingStaffId ? 'Edit Staff Record' : 'Register New Staff Member'}
 </span>
 </div>
 <button
 onClick={() => setIsStaffFormOpen(false)}
 className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
 {/* 1. Employment Type Selector */}
 <div>
 <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Employment Type (श्रेणी / पद प्रकार) *</label>
 <select
 value={staffFormData.employmentType}
 onChange={e => {
 const val = e.target.value;
 let defaultPost = staffFormData.post;
 if (val === 'REGULAR') defaultPost = 'Executive';
 else if (val === 'OUTSOURCE') defaultPost = 'MTS';
 else if (val === 'EX_SERVICEMAN') defaultPost = 'Keyman / Gateman';
 else if (val === 'RE_EMPLOYMENT') defaultPost = 'Supervisor';

 setStaffFormData(prev => ({
 ...prev,
 employmentType: val,
 post: defaultPost
 }));
 }}
 className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/60 rounded-xl text-slate-900 dark:text-white font-bold"
 >
 <option value="REGULAR">Regular</option>
 <option value="OUTSOURCE">Outsource</option>
 <option value="EX_SERVICEMAN">Ex-serviceman</option>
 <option value="RE_EMPLOYMENT">Re-employment</option>
 </select>
 </div>

 {/* 2. Names Row with Google Auto-Hindi Translation */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Name (English) *</label>
 <input
 type="text"
 required
 placeholder="e.g. Ramesh Kumar"
 value={staffFormData.name}
 onChange={async e => {
 const val = e.target.value;
 setStaffFormData(prev => ({ ...prev, name: val }));
 if (val.trim()) {
 const translated = await translateNameToHindi(val);
 if (translated) {
 setStaffFormData(prev => ({ ...prev, nameHi: translated }));
 }
 }
 }}
 className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
 />
 </div>
 <div>
 <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold flex items-center justify-between">
 <span>Name (Hindi)</span>
 <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">✨ Auto Google Translation</span>
 </label>
 <input
 type="text"
 placeholder="e.g. रमेश कुमार"
 value={staffFormData.nameHi || ''}
 onChange={e => setStaffFormData(prev => ({ ...prev, nameHi: e.target.value }))}
 className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
 />
 </div>
 </div>

 {/* 3. Father's Name */}
 <div>
 <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Father's Name (पिता का नाम)</label>
 <input
 type="text"
 placeholder="e.g. Shri Dharam Pal"
 value={staffFormData.fatherName || ''}
 onChange={e => setStaffFormData(prev => ({ ...prev, fatherName: e.target.value }))}
 className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
 />
 </div>

 {/* Universal Designation and ID Row */}
 <div className="grid grid-cols-2 gap-3">
   <div>
     <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Designation (पद नाम) *</label>
     <select
       value={staffFormData.post}
       onChange={e => {
         const newPost = e.target.value;
         let matchedEmpType = staffFormData.employmentType;
         if (newPost === 'Gateman' || newPost === 'Keyman' || newPost === 'Day Patrolman' || newPost === 'Night Patrolman' || newPost === 'Bridge Watchman') {
           matchedEmpType = 'EX_SERVICEMAN';
         } else if (newPost === 'MTS' || newPost === 'Office Staff' || newPost === 'Sweeper' || newPost === 'Cleaner') {
           matchedEmpType = 'OUTSOURCE';
         } else if (newPost === 'Supervisor') {
           matchedEmpType = 'RE_EMPLOYMENT';
         } else if (newPost === 'Executive' || newPost === 'Jr. Executive' || newPost === 'Senior Executive' || newPost === 'Assistant Project Manager (APM)' || newPost === 'Track Maintainer') {
           matchedEmpType = 'REGULAR';
         }

         setStaffFormData(prev => ({
           ...prev,
           post: newPost,
           employmentType: matchedEmpType
         }));
       }}
       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/60 rounded-xl text-slate-900 dark:text-white font-bold"
     >
       <optgroup label="Ex-Serviceman / Field Posts (पूर्व सैनिक)">
         <option value="Gateman">Gateman (गेटमैन)</option>
         <option value="Keyman">Keyman (कीमैन)</option>
         <option value="Day Patrolman">Day Patrolman (दिन पेट्रोलमैन)</option>
         <option value="Night Patrolman">Night Patrolman (रात पेट्रोलमैन)</option>
         <option value="Bridge Watchman">Bridge Watchman (ब्रिज वॉचमैन)</option>
       </optgroup>
       <optgroup label="Outsource MTS / Office Posts">
         <option value="MTS">MTS (आउटसोर्स एमटीएस)</option>
         <option value="Office Staff">Office Staff (कार्यालय स्टाफ)</option>
         <option value="Sweeper">Sweeper / Cleaner</option>
         <option value="Supervisor">Supervisor</option>
       </optgroup>
       <optgroup label="Permanent / Executive Posts">
         <option value="Executive">Executive (Civil / P-Way)</option>
         <option value="Jr. Executive">Jr. Executive (Civil / P-Way)</option>
         <option value="Senior Executive">Senior Executive</option>
         <option value="Assistant Project Manager (APM)">Assistant Project Manager (APM)</option>
         <option value="Track Maintainer">Track Maintainer</option>
       </optgroup>
     </select>
   </div>
   <div>
     <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
       {staffFormData.employmentType === 'REGULAR' ? 'Employee ID *' : 'AWPO ID / Staff ID *'}
     </label>
     <input
       type="text"
       required
       placeholder="e.g. AWPO-46535 or EMP-101518"
       value={staffFormData.awpoId || ''}
       onChange={e => setStaffFormData(prev => ({ ...prev, awpoId: e.target.value }))}
       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
     />
   </div>
 </div>

 {/* Universal Contact Numbers Row */}
 <div className="grid grid-cols-2 gap-3">
   <div>
     <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Primary Mobile No. *</label>
     <input
       type="tel"
       required
       placeholder="10-digit mobile number"
       value={staffFormData.phone || ''}
       onChange={e => setStaffFormData(prev => ({ ...prev, phone: e.target.value }))}
       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
     />
   </div>
   <div>
     <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Emergency / Alt Mobile No.</label>
     <input
       type="tel"
       placeholder="e.g. 9416000000"
       value={staffFormData.emergencyContact || ''}
       onChange={e => setStaffFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
     />
   </div>
 </div>

  {/* Category Specific Location, Beat, Gate, or Bridge Selectors */}
  {(staffFormData.employmentType === 'KEYMAN' || staffFormData.employmentType === 'PATROLMAN_DAY' || staffFormData.employmentType === 'PATROLMAN_NIGHT') && (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Beat Assignment *</label>
        <select
          value={staffFormData.beatNo || ''}
          onChange={e => {
            const b = e.target.value;
            const route = DEFAULT_BEAT_ROUTES[b];
            setStaffFormData(prev => ({
              ...prev,
              beatNo: b,
              advanceBeatCode: b,
              beatFromTo: route ? `Km ${route.fromKm.toFixed(3)} – ${route.toKm.toFixed(3)}` : prev.beatFromTo
            }));
          }}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
        >
          <option value="">-- Select Beat --</option>
          {staffFormData.employmentType === 'KEYMAN' ? (
            Array.from({ length: 34 }, (_, i) => `Beat ${String(i + 1).padStart(2, '0')}`).map(b => (
              <option key={b} value={b}>{b}</option>
            ))
          ) : staffFormData.employmentType === 'PATROLMAN_DAY' ? (
            Array.from({ length: 12 }, (_, i) => `SPD-${String(i + 1).padStart(2, '0')}`).map(b => (
              <option key={b} value={b}>{b} ({DEFAULT_BEAT_ROUTES[b]?.section || 'Day Patrol'})</option>
            ))
          ) : (
            Array.from({ length: 12 }, (_, i) => `SPN-${String(i + 1).padStart(2, '0')}`).map(b => (
              <option key={b} value={b}>{b} ({DEFAULT_BEAT_ROUTES[b]?.section || 'Night Patrol'})</option>
            ))
          )}
        </select>
      </div>

      <div>
        <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Beat Chainage (From-To) *</label>
        <input
          type="text"
          placeholder="e.g. Km 1167.210 – 1170.435"
          value={staffFormData.beatFromTo || ''}
          onChange={e => setStaffFormData(prev => ({ ...prev, beatFromTo: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
        />
      </div>
    </div>
  )}

  {staffFormData.employmentType === 'GATEMAN' && (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Level Crossing Gate *</label>
        <select
          value={staffFormData.lcNo || ''}
          onChange={e => setStaffFormData(prev => ({ ...prev, lcNo: e.target.value, headquarters: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
        >
          <option value="">-- Select Level Crossing Gate --</option>
          <option value="LC-151 (Km 1215.034)">LC-151 (Km 1215.034 - Special Class)</option>
          <option value="LC-159 (Km 1232.095)">LC-159 (Km 1232.095 - Special Class)</option>
          <option value="LC-163 (Km 1239.827)">LC-163 (Km 1239.827 - Class C)</option>
          <option value="LC-164 (Km 1244.833)">LC-164 (Km 1244.833 - Class AB/3T)</option>
          <option value="LC-167 (Km 1247.930)">LC-167 (Km 1247.930 - Class AB/3T)</option>
        </select>
      </div>
      <div>
        <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Gate Chainage / KM</label>
        <input
          type="text"
          placeholder="e.g. Km 1171.950"
          value={staffFormData.beatFromTo || ''}
          onChange={e => setStaffFormData(prev => ({ ...prev, beatFromTo: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
        />
      </div>
    </div>
  )}

  {staffFormData.employmentType === 'BR_WATCHMAN' && (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Bridge No. / Location *</label>
        <input
          type="text"
          required
          placeholder="e.g. BR. 108 (ROR Rajpura Detour)"
          value={staffFormData.bridgeNoOrKm || staffFormData.headquarters || ''}
          onChange={e => setStaffFormData(prev => ({ ...prev, bridgeNoOrKm: e.target.value, headquarters: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
        />
      </div>
      <div>
        <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Bridge Chainage / KM</label>
        <input
          type="text"
          placeholder="e.g. Km 1174.500"
          value={staffFormData.beatFromTo || ''}
          onChange={e => setStaffFormData(prev => ({ ...prev, beatFromTo: e.target.value }))}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
        />
      </div>
    </div>
  )}

  {/* Posting Headquarters / Section & Rest Day */}
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Posting Headquarters / Section *</label>
      <input
        type="text"
        required
        placeholder="e.g. IMSD SMUN HQ / KRJN-SMUN"
        value={staffFormData.headquarters || ''}
        onChange={e => setStaffFormData(prev => ({ ...prev, headquarters: e.target.value, assignedSection: e.target.value }))}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
      />
    </div>
    <div>
      <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Weekly Rest Day</label>
      <select
        value={staffFormData.restDay || 'Sunday'}
        onChange={e => setStaffFormData(prev => ({ ...prev, restDay: e.target.value }))}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
      >
        <option value="Sunday">Sunday</option>
        <option value="Monday">Monday</option>
        <option value="Tuesday">Tuesday</option>
        <option value="Wednesday">Wednesday</option>
        <option value="Thursday">Thursday</option>
        <option value="Friday">Friday</option>
        <option value="Saturday">Saturday</option>
      </select>
    </div>
  </div>

  {/* Residence / Address */}
  <div>
    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Residence / Address (निवास / पता)</label>
    <input
      type="text"
      placeholder="e.g. Railway Colony, Patiala / Shambhu Kalan"
      value={staffFormData.residence || ''}
      onChange={e => setStaffFormData(prev => ({ ...prev, residence: e.target.value }))}
      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
    />
  </div>

  {/* Photo File Input */}
  <div>
    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Photo (Optional upload or image URL)</label>
    <input
      type="file"
      accept="image/*"
      onChange={async e => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            const compressed = await compressStaffPhoto(file);
            setStaffFormData((prev: any) => ({ ...prev, photoUrl: compressed }));
          } catch (err) {
            console.error('Photo compression error:', err);
          }
        }
      }}
      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
  </div>

 <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
 <button
 type="button"
 onClick={() => setIsStaffFormOpen(false)}
 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition text-xs flex items-center gap-1.5"
 >
 <Check className="w-4 h-4" />
 <span>{editingStaffId ? 'Update Staff Record' : 'Save & Register Staff'}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* ⚡ Master Advance Beat Allotment Modal */}
 {isAdvanceAllotModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
 <div className="bg-white border border-blue-300 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
 <div className="flex items-center justify-between border-b border-slate-200 pb-3">
 <div className="flex items-center gap-2">
 <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
 <HardHat className="w-5 h-5" />
 </div>
 <div>
 <span className="text-sm font-black text-slate-900 block">
 ⚡ Advance Beat Allotment &amp; Roster
 </span>
 <span className="text-[11px] text-slate-500">
 Allot Day / Night Patrol Beat to Staff / Ex-Serviceman in Advance
 </span>
 </div>
 </div>
 <button
 onClick={() => setIsAdvanceAllotModalOpen(false)}
 className="text-slate-400 hover:text-slate-600 p-1"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleAdvanceAllotSubmit} className="space-y-4 text-xs">
 {/* 1. Select Beat Code */}
 <div>
 <label className="block text-slate-700 mb-1 font-bold">
 Select Beat to Allot:
 </label>
 <select
 value={advanceAllotData.beatCode}
 onChange={e => handleAdvanceBeatChange(e.target.value)}
 className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-blue-300 rounded-xl text-slate-900 font-bold text-xs"
 >
 <optgroup label="🌞 Day Security Patrol (SPD-01 to SPD-12)">
 {Array.from({ length: 12 }, (_, i) => `SPD-${String(i + 1).padStart(2, '0')}`).map(b => (
 <option key={b} value={b}>{b} — {DEFAULT_BEAT_ROUTES[b]?.section || 'Day Beat'}</option>
 ))}
 </optgroup>
 <optgroup label="🌙 Night Security Patrol (SPN-01 to SPN-12)">
 {Array.from({ length: 12 }, (_, i) => `SPN-${String(i + 1).padStart(2, '0')}`).map(b => (
 <option key={b} value={b}>{b} — {DEFAULT_BEAT_ROUTES[b]?.section || 'Night Beat'}</option>
 ))}
 </optgroup>
 </select>
 </div>

 {/* Real-time Beat Info Card */}
 <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1">
 <div className="flex items-center justify-between text-xs font-bold text-blue-900">
 <span>📍 {advanceAllotData.sectionCode}</span>
 <span className="font-mono text-[11px] px-2 py-0.5 bg-blue-200/60 rounded">
 Km {advanceAllotData.fromKm.toFixed(3)} – {advanceAllotData.toKm.toFixed(3)}
 </span>
 </div>
 <div className="text-[11px] text-slate-600 flex items-center gap-3">
 <span>⏱️ Shift: {advanceAllotData.shiftType === 'DAY' ? '15:00 to 23:00 (Day)' : '23:00 to 07:00 (Night)'}</span>
 <span>🛤️ Corridor: 88.679 Km</span>
 </div>
 </div>

 {/* 2. Patrolman 1 Selection */}
 <div className="space-y-2 border-t border-slate-200 pt-3">
 <div className="flex items-center justify-between">
 <label className="text-slate-800 font-bold">
 {advanceAllotData.shiftType === 'NIGHT' ? '1. Primary Patrolman (Staff / Ex-Serviceman):' : 'Patrolman Name & Details:'}
 </label>
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() => setAdvanceAllotData(prev => ({ ...prev, staffMode: 'EXISTING' }))}
 className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 advanceAllotData.staffMode === 'EXISTING'
 ? 'bg-blue-600 text-white'
 : 'bg-slate-200 text-slate-700'
 }`}
 >
 Pick Existing
 </button>
 <button
 type="button"
 onClick={() => setAdvanceAllotData(prev => ({ ...prev, staffMode: 'NEW' }))}
 className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 advanceAllotData.staffMode === 'NEW'
 ? 'bg-blue-600 text-white'
 : 'bg-slate-200 text-slate-700'
 }`}
 >
 Enter New
 </button>
 </div>
 </div>

 {advanceAllotData.staffMode === 'EXISTING' ? (
 <div>
 <select
 value={advanceAllotData.selectedStaffId}
 onChange={e => handleAdvanceStaffSelect(e.target.value, false)}
 className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
 >
 <option value="">-- Choose Existing Staff / Ex-Serviceman --</option>
 {staffList.map(s => (
 <option key={s.id} value={s.id}>
 {s.name} ({s.post}) • {s.awpoId || s.id}
 </option>
 ))}
 </select>
 </div>
 ) : (
 <div>
 <input
 type="text"
 required
 placeholder="e.g. Shri Hardeep Singh"
 value={advanceAllotData.name}
 onChange={e => setAdvanceAllotData(prev => ({ ...prev, name: e.target.value }))}
 className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
 />
 </div>
 )}

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[11px] text-slate-500 mb-0.5">AWPO / Staff ID:</label>
 <input
 type="text"
 placeholder="AWPO-14570"
 value={advanceAllotData.awpoId}
 onChange={e => setAdvanceAllotData(prev => ({ ...prev, awpoId: e.target.value }))}
 className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
 />
 </div>
 <div>
 <label className="block text-[11px] text-slate-500 mb-0.5">Mobile Number:</label>
 <input
 type="tel"
 placeholder="10-digit mobile"
 value={advanceAllotData.phone}
 onChange={e => setAdvanceAllotData(prev => ({ ...prev, phone: e.target.value }))}
 className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
 />
 </div>
 </div>
 </div>

 {/* 3. Patrolman 2 Selection (Night Shift Only) */}
 {advanceAllotData.shiftType === 'NIGHT' && (
 <div className="space-y-2 border-t border-slate-200 pt-3">
 <div className="flex items-center justify-between">
 <label className="text-slate-800 font-bold">
 2. Patrol Partner (2nd Man in Pair):
 </label>
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() => setAdvanceAllotData(prev => ({ ...prev, partnerMode: 'EXISTING' }))}
 className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 advanceAllotData.partnerMode === 'EXISTING'
 ? 'bg-indigo-600 text-white'
 : 'bg-slate-200 text-slate-700'
 }`}
 >
 Pick Existing
 </button>
 <button
 type="button"
 onClick={() => setAdvanceAllotData(prev => ({ ...prev, partnerMode: 'NEW' }))}
 className={`px-2 py-0.5 rounded text-[10px] font-bold ${
 advanceAllotData.partnerMode === 'NEW'
 ? 'bg-indigo-600 text-white'
 : 'bg-slate-200 text-slate-700'
 }`}
 >
 Enter New
 </button>
 </div>
 </div>

 {advanceAllotData.partnerMode === 'EXISTING' ? (
 <div>
 <select
 value={advanceAllotData.partnerStaffId}
 onChange={e => handleAdvanceStaffSelect(e.target.value, true)}
 className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
 >
 <option value="">-- Choose Patrol Partner --</option>
 {staffList.map(s => (
 <option key={s.id} value={s.id}>
 {s.name} ({s.post}) • {s.awpoId || s.id}
 </option>
 ))}
 </select>
 </div>
 ) : (
 <div>
 <input
 type="text"
 placeholder="e.g. Shri Balkar Singh"
 value={advanceAllotData.partnerName}
 onChange={e => setAdvanceAllotData(prev => ({ ...prev, partnerName: e.target.value }))}
 className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
 />
 </div>
 )}

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-[11px] text-slate-500 mb-0.5">Partner AWPO ID:</label>
 <input
 type="text"
 placeholder="AWPO-70023"
 value={advanceAllotData.partnerAwpoId}
 onChange={e => setAdvanceAllotData(prev => ({ ...prev, partnerAwpoId: e.target.value }))}
 className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
 />
 </div>
 <div>
 <label className="block text-[11px] text-slate-500 mb-0.5">Rest Day Assigned:</label>
 <select
 value={advanceAllotData.restDay}
 onChange={e => setAdvanceAllotData(prev => ({ ...prev, restDay: e.target.value }))}
 className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
 >
 <option value="Sunday">Sunday</option>
 <option value="Monday">Monday</option>
 <option value="Tuesday">Tuesday</option>
 <option value="Wednesday">Wednesday</option>
 <option value="Thursday">Thursday</option>
 <option value="Friday">Friday</option>
 <option value="Saturday">Saturday</option>
 </select>
 </div>
 </div>
 </div>
 )}

 {advanceAllotData.shiftType === 'DAY' && (
 <div>
 <label className="block text-slate-700 mb-1 font-bold">Rest Day Assigned:</label>
 <select
 value={advanceAllotData.restDay}
 onChange={e => setAdvanceAllotData(prev => ({ ...prev, restDay: e.target.value }))}
 className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
 >
 <option value="Sunday">Sunday</option>
 <option value="Monday">Monday</option>
 <option value="Tuesday">Tuesday</option>
 <option value="Wednesday">Wednesday</option>
 <option value="Thursday">Thursday</option>
 <option value="Friday">Friday</option>
 <option value="Saturday">Saturday</option>
 </select>
 </div>
 )}

 <button
 type="submit"
 className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black rounded-xl shadow-lg transition"
 >
 Save &amp; Allot Beat in Advance ({advanceAllotData.beatCode})
 </button>
 </form>
 </div>
 </div>
 )}

 {/* Quick Single Assign Modal */}
 {quickAssignTarget && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
 <div className="bg-white border-2 border-red-500 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
 <div className="flex items-center justify-between border-b border-slate-200 pb-3">
 <div className="flex items-center gap-2 text-red-600">
 <ShieldAlert className="w-5 h-5" />
 <span className="text-sm font-black uppercase tracking-wide text-slate-900">
 🚨 Assign Ex-Serviceman ({quickAssignTarget.beatTitle})
 </span>
 </div>
 <button
 onClick={() => setQuickAssignTarget(null)}
 className="text-slate-400 hover:text-slate-600 p-1"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleQuickAssignSubmit} className="space-y-3 text-xs">
 <div>
 <label className="block text-slate-600 mb-1 font-semibold">Ex-Serviceman Name:</label>
 <input
 type="text"
 required
 placeholder="e.g. Shri Hardeep Singh"
 value={assignFormData.name}
 onChange={e => setAssignFormData(prev => ({ ...prev, name: e.target.value }))}
 className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:border-red-500"
 />
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="block text-slate-600 mb-1 font-semibold">AWPO ID:</label>
 <input
 type="text"
 placeholder="AWPO-70231"
 value={assignFormData.awpoId}
 onChange={e => setAssignFormData(prev => ({ ...prev, awpoId: e.target.value }))}
 className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
 />
 </div>
 <div>
 <label className="block text-slate-600 mb-1 font-semibold">Mobile Number:</label>
 <input
 type="tel"
 placeholder="10-digit mobile"
 value={assignFormData.phone}
 onChange={e => setAssignFormData(prev => ({ ...prev, phone: e.target.value }))}
 className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
 />
 </div>
 </div>

 <div>
 <label className="block text-slate-600 mb-1 font-semibold">Rest Day Assigned:</label>
 <select
 value={assignFormData.restDay}
 onChange={e => setAssignFormData(prev => ({ ...prev, restDay: e.target.value }))}
 className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
 >
 <option value="Sunday">Sunday</option>
 <option value="Monday">Monday</option>
 <option value="Tuesday">Tuesday</option>
 <option value="Wednesday">Wednesday</option>
 <option value="Thursday">Thursday</option>
 <option value="Friday">Friday</option>
 <option value="Saturday">Saturday</option>
 </select>
 </div>

 <button
 type="submit"
 className="w-full py-3 bg-[#123b72] hover:bg-[#1a4b8c] text-white font-bold rounded-xl shadow-lg transition"
 >
 Confirm &amp; Fill Vacant Beat
 </button>
 </form>
 </div>
 </div>
 )}

 <PersonalQRModal
 staff={selectedStaffForQR}
 isOpen={Boolean(selectedStaffForQR)}
 onClose={() => setSelectedStaffForQR(null)}
 onStaffUpdated={updated => {
 setStaffList(prev => prev.map(s => (s.id === updated.id ? updated : s)));
 }}
 />

 <StaffIdModal
 staff={selectedStaffForIdModal}
 isOpen={Boolean(selectedStaffForIdModal)}
 onClose={() => setSelectedStaffForIdModal(null)}
 />

 <QRScannerModal
 isOpen={isScannerOpen}
 onClose={() => setIsScannerOpen(false)}
 sampleStaffList={staffList}
 />
 </div>
 );
};
