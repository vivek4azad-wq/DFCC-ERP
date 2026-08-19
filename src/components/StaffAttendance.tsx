
const MONTHLY_CATEGORY_GROUPS = [
  { key: "ALL", label: "All Categories (Consolidated)", icon: "📊" },
  { key: "PERMANENT", label: "1. Permanent Staff", icon: "🏛️" },
  { key: "OFFICE_STAFF", label: "2. Office Staff (Sweeper, Office boy)", icon: "🏢" },
  { key: "OUTSOURCE_GANG", label: "3. Outsource Staff (MTS outsource, Mate)", icon: "🛠️" },
  { key: "EX_SERVICEMAN", label: "4. Ex-Serviceman (Keyman, Patrolman day/night, Gateman, Watchman)", icon: "🎖️" }
];
/**
 * Staff Daily Attendance & Monthly Absentee Statement ERP
 * DFCCIL IMSD SMUN Unit (Civil / P-Way)
 * 
 * Status Sets:
 * 1. Permanent Staff: Present (P), Rest (REST), LAP, LHAP, CL, RH, Paternity Leave (PL), Off (OFF), NH, CR, Medical Leave (MED), On Duty (OD), Absent (A)
 * 2. Outsource Staff: Present (P), Leave (L), Rest (REST), Off (OFF), CR, NH, On Duty (OD), Absent (A)
 * 
 * Features:
 * - Dynamic Attendance Selector customized per staff employment category
 * - User Power to declare Working Day, Sunday/Rest, or National Holiday (NH)
 * - Complete Month-End Absentee Statement with Net Working Days & Leave Breakdown
 * - 31-Day Matrix Grid with Sunday & NH Highlighting
 * - Official DFCCIL Letterhead Print & Instant CSV/Excel Export
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/database.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CalendarCheck,
  Calendar,
  FileSpreadsheet,
  Sparkles,
  Search,
  Download,
  Printer,
  Plus,
  Trash2,
  Filter,
  Lock,
  Unlock,
  Phone,
  MessageSquare,
  X,
} from 'lucide-react';
import { StaffIdModal, type UnifiedStaffModalData } from './StaffIdModal.tsx';
import type {
  DailyAttendanceRecord,
  HolidayDeclarationRecord,
  AttendanceStatus,
  OfficerStaffRecord,
  KeymanRecord,
  PatrolShiftRecord,
  LevelCrossingRecord,
  BridgeWatchmanRecord
} from '../types/index.ts';

// Default Gazetted Indian Railway & DFCCIL National Holidays for 2026
const DEFAULT_HOLIDAYS_2026: Record<string, string> = {
  '2026-01-26': 'Republic Day (NH)',
  '2026-03-04': 'Holi (Gazetted)',
  '2026-03-21': 'Eid-ul-Fitr (Gazetted)',
  '2026-04-03': 'Good Friday (Gazetted)',
  '2026-04-14': 'Dr. B.R. Ambedkar Jayanti',
  '2026-05-01': 'May Day / Labour Day',
  '2026-05-31': 'Bakrid / Eid-ul-Adha',
  '2026-08-15': 'Independence Day (NH)',
  '2026-08-28': 'Raksha Bandhan',
  '2026-09-04': 'Janmashtami',
  '2026-10-02': 'Mahatma Gandhi Jayanti (NH)',
  '2026-10-20': 'Dussehra / Vijaya Dashami',
  '2026-11-08': 'Diwali / Deepavali',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-25': 'Christmas Day (Gazetted)'
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface StaffRosterItem {
  id: string;
  name: string;
  designation: string;
  category: 'PERMANENT' | 'OFFICE_STAFF' | 'OUTSOURCE_GANG' | 'EX_SERVICEMAN' | 'KEYMAN' | 'PATROL' | 'GATEMAN' | 'WATCHMAN' | 'OUTSOURCE';
  categoryLabel: string;
  isPermanent: boolean;
  awpoId: string;
  phone: string;
  beatOrSection: string;
  photoUrl?: string;
  fatherName?: string;
  residence?: string;
  district?: string;
}

// Permanent Status Options Definition
const PERMANENT_STATUS_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  short: string;
  colorClass: string;
  activeClass: string;
}[] = [
  { status: 'P', label: 'Present', short: 'P', colorClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200', activeClass: 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-bold' },
  { status: 'REST', label: 'Rest / Sunday', short: 'REST', colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200', activeClass: 'bg-blue-600 text-white ring-2 ring-blue-400 font-bold' },
  { status: 'LAP', label: 'Leave on Average Pay (LAP)', short: 'LAP', colorClass: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200', activeClass: 'bg-cyan-700 text-white ring-2 ring-cyan-400 font-bold' },
  { status: 'LHAP', label: 'Leave on Half Average Pay (LHAP)', short: 'LHAP', colorClass: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200', activeClass: 'bg-teal-700 text-white ring-2 ring-teal-400 font-bold' },
  { status: 'CL', label: 'Casual Leave (CL)', short: 'CL', colorClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200', activeClass: 'bg-amber-600 text-white ring-2 ring-amber-400 font-bold' },
  { status: 'RH', label: 'Restricted Holiday (RH)', short: 'RH', colorClass: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200', activeClass: 'bg-orange-600 text-white ring-2 ring-orange-400 font-bold' },
  { status: 'PL', label: 'Paternity / Maternity Leave (PL)', short: 'PL', colorClass: 'bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200', activeClass: 'bg-pink-600 text-white ring-2 ring-pink-400 font-bold' },
  { status: 'OFF', label: 'Scheduled Off', short: 'OFF', colorClass: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300', activeClass: 'bg-slate-700 text-white ring-2 ring-slate-400 font-bold' },
  { status: 'NH', label: 'National Holiday (NH)', short: 'NH', colorClass: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200', activeClass: 'bg-purple-600 text-white ring-2 ring-purple-400 font-bold' },
  { status: 'CR', label: 'Compensatory Rest (CR)', short: 'CR', colorClass: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200', activeClass: 'bg-indigo-600 text-white ring-2 ring-indigo-400 font-bold' },
  { status: 'MED', label: 'Medical / Sick Leave (MED)', short: 'MED', colorClass: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200', activeClass: 'bg-rose-600 text-white ring-2 ring-rose-400 font-bold' },
  { status: 'OD', label: 'On Duty / Tour (OD)', short: 'OD', colorClass: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200', activeClass: 'bg-violet-600 text-white ring-2 ring-violet-400 font-bold' },
  { status: 'A', label: 'Absent (Unauthorized)', short: 'A', colorClass: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200', activeClass: 'bg-red-600 text-white ring-2 ring-red-400 font-bold' },
];

// Outsource Status Options Definition
const OUTSOURCE_STATUS_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  short: string;
  colorClass: string;
  activeClass: string;
}[] = [
  { status: 'P', label: 'Present', short: 'P', colorClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200', activeClass: 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-bold' },
  { status: 'L', label: 'Leave', short: 'L', colorClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200', activeClass: 'bg-amber-600 text-white ring-2 ring-amber-400 font-bold' },
  { status: 'REST', label: 'Weekly Rest', short: 'REST', colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200', activeClass: 'bg-blue-600 text-white ring-2 ring-blue-400 font-bold' },
  { status: 'OFF', label: 'Shift Off', short: 'OFF', colorClass: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300', activeClass: 'bg-slate-700 text-white ring-2 ring-slate-400 font-bold' },
  { status: 'CR', label: 'Compensatory Rest (CR)', short: 'CR', colorClass: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200', activeClass: 'bg-indigo-600 text-white ring-2 ring-indigo-400 font-bold' },
  { status: 'NH', label: 'National Holiday (NH)', short: 'NH', colorClass: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200', activeClass: 'bg-purple-600 text-white ring-2 ring-purple-400 font-bold' },
  { status: 'OD', label: 'On Duty (OD)', short: 'OD', colorClass: 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200', activeClass: 'bg-violet-600 text-white ring-2 ring-violet-400 font-bold' },
  { status: 'A', label: 'Absent (Unauthorized)', short: 'A', colorClass: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200', activeClass: 'bg-red-600 text-white ring-2 ring-red-400 font-bold' },
];

export const StaffAttendance: React.FC = () => {
  const { currentUser, role, currentAppRole } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN' || currentAppRole === 'APM';
  const isOfficerUser = role === 'OFFICER' || currentAppRole === 'Executive';

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const isDateLockedForNonAdmin = useMemo(() => {
    if (isSuperAdmin) return false; // Super Admin (Vivek Kumar Azad / APM) can edit anytime
    if (!selectedDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(selectedDate + 'T00:00:00');
    target.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Locked if date is older than 4 days in the past
    return diffDays > 4;
  }, [selectedDate, isSuperAdmin]);

  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'holidays'>('daily');

  // Month-end statement month/year
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonthlyCategory, setSelectedMonthlyCategory] = useState<string>("ALL");

  // Collections
  const [allStaffList, setAllStaffList] = useState<StaffRosterItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendanceRecord[]>([]);
  const [holidayRecords, setHolidayRecords] = useState<HolidayDeclarationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Staff ID Modal
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<UnifiedStaffModalData | null>(null);

  // Add Holiday Modal
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [holidayFormData, setHolidayFormData] = useState({
    date: todayStr,
    title: '',
    type: 'NH' as 'NH' | 'REST' | 'SUNDAY' | 'SPECIAL',
    remarks: ''
  });

  // Load all staff from the master database collections
  const loadMasterData = async () => {
    setIsLoading(true);
    try {
      const [officers, keymen, patrols, lcs, watchmen, attendances, holidays] = await Promise.all([
        db.getCollection<OfficerStaffRecord>('officers_staff'),
        db.getCollection<KeymanRecord>('keymen'),
        db.getCollection<PatrolShiftRecord>('patrol_shifts'),
        db.getCollection<LevelCrossingRecord>('level_crossings'),
        db.getCollection<BridgeWatchmanRecord>('bridge_watchmen'),
        db.getCollection<DailyAttendanceRecord>('staff_attendance'),
        db.getCollection<HolidayDeclarationRecord>('attendance_holidays')
      ]);

      const compiledStaff: StaffRosterItem[] = [];
      const seenIds = new Set<string>();

      // 1. Officers & Permanent/Office/Outsource Staff
      officers.forEach(o => {
        // 🔒 Privacy Constraint: If logged in as Officer, do NOT show APM (Shri Vivek Kumar Azad)'s attendance!
        const isApmRecord = (o.name && (o.name.toLowerCase().includes('vivek') || o.name.toLowerCase().includes('azad'))) ||
                            o.role === 'SUPER_ADMIN' ||
                            o.id === 'EMP-101518' ||
                            (o.post && /apm|assistant\s*project\s*manager/i.test(o.post));

        if (isOfficerUser && isApmRecord) {
          return; // Skip APM record so Officer cannot see APM's attendance
        }

        const sid = o.id || `off_${o.awpoId || o.name}`;
        if (!seenIds.has(sid)) {
          seenIds.add(sid);
          const isPerm = o.employmentType === 'REGULAR' || o.employmentType === 'DEPUTATION' || o.staffCategory === 'PERMANENT' || o.role === 'SUPER_ADMIN';
          const postLower = (o.post || o.designation || '').toLowerCase();
          const empType = (o.employmentType || '').toUpperCase();
          const sectionLower = (o.assignedSection || o.headquarters || '').toLowerCase();

          let cat: 'PERMANENT' | 'OFFICE_STAFF' | 'OUTSOURCE_GANG' | 'KEYMAN' | 'PATROL' | 'GATEMAN' | 'WATCHMAN' = 'OUTSOURCE_GANG';
          let catLabel = 'Outsource Staff (MTS outsource, Mate)';

          if (isPerm) {
            cat = 'PERMANENT';
            catLabel = 'Permanent Staff';
          } else if (empType === 'KEYMAN' || postLower.includes('keyman') || sectionLower.includes('keyman') || o.beatNoText || (o.id && String(o.id).startsWith('KM'))) {
            cat = 'KEYMAN';
            catLabel = 'Keyman (Ex-Serviceman)';
          } else if (empType.includes('PATROL') || postLower.includes('patrol') || sectionLower.includes('patrol') || sectionLower.includes('spd') || sectionLower.includes('spn')) {
            cat = 'PATROL';
            catLabel = 'Patrolman (Day/Night Security)';
          } else if (empType === 'GATEMAN' || postLower.includes('gateman') || postLower.includes('gate') || postLower.includes('lc') || sectionLower.includes('lc ') || sectionLower.includes('gate') || o.lcNo) {
            cat = 'GATEMAN';
            catLabel = 'Gateman (LC Gate Lodge)';
          } else if (empType === 'BR_WATCHMAN' || postLower.includes('watchman') || postLower.includes('bridge') || sectionLower.includes('bridge') || o.bridgeNoOrKm) {
            cat = 'WATCHMAN';
            catLabel = 'Bridge Watchman (BR. 108)';
          } else if (empType === 'OFFICE_STAFF' || /sweeper|office\s*boy|computer\s*operator|cleaner|gardener|pump|peon|driver|cook/i.test(postLower)) {
            cat = 'OFFICE_STAFF';
            catLabel = 'Office Staff (Sweeper, Office boy)';
          }

          compiledStaff.push({
            id: sid,
            name: o.name,
            designation: o.post || (cat === 'KEYMAN' ? 'Keyman' : cat === 'PATROL' ? 'Patrolman' : cat === 'GATEMAN' ? 'Gateman' : cat === 'WATCHMAN' ? 'Bridge Watchman' : 'Staff'),
            category: cat,
            categoryLabel: catLabel,
            isPermanent: isPerm,
            awpoId: o.awpoId || o.employeeId || o.id || '-',
            phone: o.phone || '-',
            beatOrSection: o.assignedSection || o.headquarters || 'IMSD SMUN',
            photoUrl: o.photoUrl,
            fatherName: o.fatherName,
            residence: o.residence,
            district: o.district
          });
        }
      });

      // 2. Keymen (Ex-Servicemen)
      keymen.forEach(k => {
        const sid = `km_${k.id || k.awpoId || k.name}`;
        if (!seenIds.has(sid)) {
          seenIds.add(sid);
          compiledStaff.push({
            id: sid,
            name: k.name,
            designation: `Keyman (${k.beatNoText || 'Beat'})`,
            category: 'KEYMAN' as any,
            categoryLabel: 'Keyman (Ex-Serviceman)',
            isPermanent: false,
            awpoId: k.awpoId || k.id || '-',
            phone: k.mobileNo || k.otherMobileNo || '-',
            beatOrSection: `${k.beatNoText || 'Keyman Beat'} (${k.kmRange || `Km ${k.fromKm.toFixed(3)}-${k.toKm.toFixed(3)}`})`,
            fatherName: k.fatherName,
            residence: k.residence,
            district: k.district
          });
        }
      });

      // 3. Patrolmen (Ex-Servicemen)
      patrols.forEach(p => {
        if (p.patrolmanName && !p.patrolmanName.includes('Vacant')) {
          const sid = `pat_${p.patrolmanStaffId || p.beatCode || p.patrolmanName}`;
          if (!seenIds.has(sid)) {
            seenIds.add(sid);
            compiledStaff.push({
              id: sid,
              name: p.patrolmanName,
              designation: p.shiftType === 'DAY' ? 'Day Patrolman' : 'Night Patrolman',
              category: 'PATROL' as any,
              categoryLabel: 'Patrolman (Day/Night Security)',
              isPermanent: false,
              awpoId: p.patrolmanStaffId || p.awpoId || '-',
              phone: p.patrolmanPhone || '-',
              beatOrSection: `${p.beatCode} (${p.route || `Km ${p.fromKm.toFixed(3)}-${p.toKm.toFixed(3)}`})`,
              residence: p.remarks
            });
          }
        }
      });

      // 4. Gatemen (Ex-Servicemen)
      lcs.forEach(lc => {
        (lc.gatemen || []).forEach((gm: any) => {
          const sid = `gm_${gm.id || gm.name}`;
          if (!seenIds.has(sid)) {
            seenIds.add(sid);
            compiledStaff.push({
              id: sid,
              name: gm.name,
              designation: `Gateman (LC ${lc.gateNo || lc.lc_no})`,
              category: 'GATEMAN' as any,
              categoryLabel: 'Gateman (LC Gate Lodge)',
              isPermanent: false,
              awpoId: gm.id || '-',
              phone: gm.mobile || '-',
              beatOrSection: `LC Gate ${lc.gateNo || lc.lc_no} (Km ${Number(lc.km || lc.chainage || 0).toFixed(3)})`,
              residence: gm.residence
            });
          }
        });
      });

      // 5. Watchmen (Ex-Servicemen)
      watchmen.forEach(w => {
        const sid = `wm_${w.staffId || w.id || w.name}`;
        if (!seenIds.has(sid)) {
          seenIds.add(sid);
          compiledStaff.push({
            id: sid,
            name: w.name,
            designation: w.post || 'Bridge Watchman',
            category: 'WATCHMAN' as any,
            categoryLabel: 'Bridge Watchman (BR. 108)',
            isPermanent: false,
            awpoId: w.awpoId || w.staffId || '-',
            phone: w.phone || '-',
            beatOrSection: `Bridge ${w.bridgeNo || '108'} (ROR Rajpura Detour)`,
            residence: w.location
          });
        }
      });

      setAllStaffList(compiledStaff);
      setAttendanceRecords(attendances);
      setHolidayRecords(holidays);
    } catch (err) {
      console.error('Failed to load attendance master data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();

    // Listen for database changes to keep in sync
    const unsub = db.subscribe(() => {
      loadMasterData();
    });
    return () => unsub();
  }, []);

  // Determine if a date is a Sunday or declared Holiday (NH / Rest)
  const getDateClassification = (dateStr: string): {
    isHoliday: boolean;
    title: string;
    type: 'NH' | 'SUNDAY' | 'REST' | 'SPECIAL' | 'NORMAL';
    isSunday: boolean;
    isNH: boolean;
  } => {
    const d = new Date(dateStr + 'T00:00:00');
    const isSunday = d.getDay() === 0;

    // Check user-declared holidays in DB first
    const customHoliday = holidayRecords.find(h => h.date === dateStr);
    const defaultNH = DEFAULT_HOLIDAYS_2026[dateStr];

    if (customHoliday) {
      return {
        isHoliday: true,
        title: customHoliday.title,
        type: customHoliday.type,
        isSunday: isSunday || customHoliday.type === 'SUNDAY',
        isNH: customHoliday.isNH || customHoliday.type === 'NH'
      };
    }

    if (defaultNH) {
      return {
        isHoliday: true,
        title: defaultNH,
        type: 'NH',
        isSunday,
        isNH: true
      };
    }

    if (isSunday) {
      return {
        isHoliday: true,
        title: 'Sunday (Weekly Off)',
        type: 'SUNDAY',
        isSunday: true,
        isNH: false
      };
    }

    return {
      isHoliday: false,
      title: 'Normal Working Day',
      type: 'NORMAL',
      isSunday: false,
      isNH: false
    };
  };

  const currentDateInfo = useMemo(() => getDateClassification(selectedDate), [selectedDate, holidayRecords]);

  // Attendance map for selected date
  const dailyAttendanceMap = useMemo(() => {
    const map = new Map<string, DailyAttendanceRecord>();
    attendanceRecords
      .filter(r => r.date === selectedDate)
      .forEach(r => map.set(r.staffId, r));
    return map;
  }, [attendanceRecords, selectedDate]);

  // Helper to get status of a staff on selected date with smart fallbacks
  const getStaffStatus = (staff: StaffRosterItem): { status: AttendanceStatus; remarks: string } => {
    const existing = dailyAttendanceMap.get(staff.id);
    if (existing) {
      return { status: existing.status, remarks: existing.remarks || '' };
    }
    // Smart default based on date classification
    if (currentDateInfo.isNH) {
      return { status: 'NH', remarks: currentDateInfo.title };
    }
    if (currentDateInfo.isSunday) {
      return { status: 'REST', remarks: 'Sunday Rest' };
    }
    return { status: 'P', remarks: '' };
  };

  // Mark status for single staff
  const handleMarkStaffStatus = async (staff: StaffRosterItem, status: AttendanceStatus, remarks?: string) => {
    if (isDateLockedForNonAdmin) {
      alert('🔒 Attendance Lock: 4 din se purani attendance entry me badlav restricted hai. Yeh entry kewal APM / Civil (Shri Vivek Kumar Azad, Super Admin) ke login se hi unlock/edit ho sakti hai.');
      return;
    }
    const recordId = `${selectedDate}_${staff.id}`;
    const payload: DailyAttendanceRecord = {
      id: recordId,
      date: selectedDate,
      staffId: staff.id,
      staffName: staff.name,
      designation: staff.designation,
      category: staff.category,
      awpoId: staff.awpoId,
      phone: staff.phone,
      status,
      remarks: remarks !== undefined ? remarks : (dailyAttendanceMap.get(staff.id)?.remarks || ''),
      updatedBy: currentUser?.name || 'Incharge / Super Admin',
      updatedAt: new Date().toISOString()
    };

    try {
      const existing = dailyAttendanceMap.get(staff.id);
      if (existing) {
        await db.updateDocument('staff_attendance', existing.id, payload, currentUser);
      } else {
        await db.addDocument('staff_attendance', payload, currentUser);
      }
    } catch (err: any) {
      alert(`Failed to record attendance: ${err.message}`);
    }
  };

  // Bulk mark all staff for the day
  const handleBulkMark = async (status: AttendanceStatus, defaultRemarks?: string) => {
    if (isDateLockedForNonAdmin) {
      alert('🔒 Attendance Lock: 4 din se purani attendance entry me badlav restricted hai. Yeh entry kewal APM / Civil (Shri Vivek Kumar Azad, Super Admin) ke login se hi unlock/edit ho sakti hai.');
      return;
    }
    try {
      for (const staff of allStaffList) {
        const recordId = `${selectedDate}_${staff.id}`;
        const payload: DailyAttendanceRecord = {
          id: recordId,
          date: selectedDate,
          staffId: staff.id,
          staffName: staff.name,
          designation: staff.designation,
          category: staff.category,
          awpoId: staff.awpoId,
          phone: staff.phone,
          status,
          remarks: defaultRemarks || (status === 'REST' || status === 'WO' ? 'Weekly Off / Sunday' : status === 'NH' ? currentDateInfo.title : ''),
          updatedBy: currentUser?.name || 'Incharge',
          updatedAt: new Date().toISOString()
        };
        const existing = dailyAttendanceMap.get(staff.id);
        if (existing) {
          await db.updateDocument('staff_attendance', existing.id, payload, currentUser);
        } else {
          await db.addDocument('staff_attendance', payload, currentUser);
        }
      }
      setSaveSuccessMsg(`All ${allStaffList.length} staff marked as ${status} for ${selectedDate}`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Bulk update failed: ${err.message}`);
    }
  };

  // Declare Day Type (Toggle between Working Day, Sunday/Rest, and NH)
  const handleDeclareDayType = async (type: 'NORMAL' | 'SUNDAY' | 'NH', customTitle?: string) => {
    if (isDateLockedForNonAdmin) {
      alert('🔒 Attendance Lock: 4 din se purani attendance entry me badlav restricted hai. Yeh entry kewal APM / Civil (Shri Vivek Kumar Azad, Super Admin) ke login se hi unlock/edit ho sakti hai.');
      return;
    }
    try {
      if (type === 'NORMAL') {
        const existing = holidayRecords.find(h => h.date === selectedDate);
        if (existing) {
          await db.deleteDocument('attendance_holidays', existing.id, currentUser);
        }
        await handleBulkMark('P', 'Normal Working Day');
      } else if (type === 'SUNDAY') {
        const payload: HolidayDeclarationRecord = {
          id: selectedDate,
          date: selectedDate,
          title: 'Sunday / Weekly Off',
          type: 'SUNDAY',
          isNH: false,
          isRest: true,
          declaredBy: currentUser?.name || 'Super Admin'
        };
        const existing = holidayRecords.find(h => h.date === selectedDate);
        if (existing) {
          await db.updateDocument('attendance_holidays', existing.id, payload, currentUser);
        } else {
          await db.addDocument('attendance_holidays', payload, currentUser);
        }
        await handleBulkMark('REST', 'Sunday Rest');
      } else if (type === 'NH') {
        const title = customTitle || prompt('Enter National Holiday / Gazetted Holiday Title (e.g. Independence Day, Diwali):', 'National Holiday (NH)') || 'National Holiday (NH)';
        const payload: HolidayDeclarationRecord = {
          id: selectedDate,
          date: selectedDate,
          title,
          type: 'NH',
          isNH: true,
          isRest: true,
          declaredBy: currentUser?.name || 'Super Admin'
        };
        const existing = holidayRecords.find(h => h.date === selectedDate);
        if (existing) {
          await db.updateDocument('attendance_holidays', existing.id, payload, currentUser);
        } else {
          await db.addDocument('attendance_holidays', payload, currentUser);
        }
        await handleBulkMark('NH', title);
      }
    } catch (err: any) {
      alert(`Failed to update day classification: ${err.message}`);
    }
  };

  // Add / Edit Custom Holiday in Master
  const handleSaveHolidayForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: HolidayDeclarationRecord = {
        id: holidayFormData.date,
        date: holidayFormData.date,
        title: holidayFormData.title,
        type: holidayFormData.type,
        isNH: holidayFormData.type === 'NH',
        isRest: holidayFormData.type === 'REST' || holidayFormData.type === 'SUNDAY' || holidayFormData.type === 'NH',
        remarks: holidayFormData.remarks,
        declaredBy: currentUser?.name || 'Super Admin'
      };
      const existing = holidayRecords.find(h => h.date === holidayFormData.date);
      if (existing) {
        await db.updateDocument('attendance_holidays', existing.id, payload, currentUser);
      } else {
        await db.addDocument('attendance_holidays', payload, currentUser);
      }
      setIsAddHolidayModalOpen(false);
      setHolidayFormData({ date: todayStr, title: '', type: 'NH', remarks: '' });
      setSaveSuccessMsg('Holiday saved to master successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Error saving holiday: ${err.message}`);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to remove this declared holiday?')) return;
    try {
      await db.deleteDocument('attendance_holidays', id, currentUser);
    } catch (err: any) {
      alert(`Error deleting holiday: ${err.message}`);
    }
  };

  // Daily Filtered Staff
  const filteredDailyStaff = useMemo(() => {
    return allStaffList.filter(s => {
      // Category filter
      if (selectedCategoryFilter && selectedCategoryFilter !== 'ALL') {
        const filterVal = selectedCategoryFilter.toUpperCase();
        const sCat = (s.category || '').toUpperCase();
        const des = (s.designation || '').toLowerCase();
        const sec = (s.beatOrSection || '').toLowerCase();

        if (filterVal === 'PERMANENT') {
          if (sCat !== 'PERMANENT' && !s.isPermanent) return false;
        } else if (filterVal === 'OUTSOURCE') {
          if (sCat !== 'OUTSOURCE' && sCat !== 'OUTSOURCE_GANG' && sCat !== 'OFFICE_STAFF' && !des.includes('mts') && !des.includes('mate') && !des.includes('gang') && !des.includes('maintainer')) return false;
        } else if (filterVal === 'KEYMAN') {
          if (sCat !== 'KEYMAN' && !des.includes('keyman') && !sec.includes('keyman')) return false;
        } else if (filterVal === 'PATROL') {
          if (sCat !== 'PATROL' && !des.includes('patrol') && !sec.includes('spd') && !sec.includes('spn')) return false;
        } else if (filterVal === 'GATEMAN') {
          if (sCat !== 'GATEMAN' && !des.includes('gateman') && !des.includes('lc') && !sec.includes('gate') && !sec.includes('lc-') && !sec.includes('lc ')) return false;
        } else if (filterVal === 'WATCHMAN') {
          if (sCat !== 'WATCHMAN' && !des.includes('watchman') && !des.includes('bridge') && !sec.includes('bridge')) return false;
        } else if (sCat !== filterVal) {
          return false;
        }
      }
      // Status filter
      if (selectedStatusFilter !== 'ALL') {
        const cur = getStaffStatus(s);
        if (cur.status !== selectedStatusFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q) ||
          s.awpoId.toLowerCase().includes(q) ||
          s.beatOrSection.toLowerCase().includes(q) ||
          s.phone.includes(q)
        );
      }
      return true;
    });
  }, [allStaffList, selectedCategoryFilter, selectedStatusFilter, searchQuery, dailyAttendanceMap, currentDateInfo]);

  // Today's summary statistics
  const dailyMetrics = useMemo(() => {
    let p = 0;
    let a = 0;
    let l = 0;
    let rest = 0;
    let nh = 0;
    let od = 0;
    let off = 0;
    let cr = 0;

    allStaffList.forEach(s => {
      const { status } = getStaffStatus(s);
      if (status === 'P') p++;
      else if (status === 'A') a++;
      else if (status === 'REST' || status === 'WO') rest++;
      else if (status === 'NH') nh++;
      else if (status === 'OD') od++;
      else if (status === 'OFF') off++;
      else if (status === 'CR') cr++;
      else l++; // LAP, LHAP, CL, RH, PL, MED, L
    });

    return {
      total: allStaffList.length,
      p,
      a,
      l,
      rest,
      nh,
      od,
      off,
      cr,
      rate: allStaffList.length > 0 ? Math.round((p / allStaffList.length) * 100) : 0
    };
  }, [allStaffList, dailyAttendanceMap, currentDateInfo]);

  // -------------------------------------------------------------------------
  // MONTHLY ABSENTEE STATEMENT CALCULATIONS
  // -------------------------------------------------------------------------
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  const monthDates = useMemo(() => {
    const dates: { dateStr: string; dayNum: number; dayName: string; isSunday: boolean; isNH: boolean; title: string }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const pad = String(day).padStart(2, '0');
      const mPad = String(selectedMonth + 1).padStart(2, '0');
      const dateStr = `${selectedYear}-${mPad}-${pad}`;
      const classification = getDateClassification(dateStr);
      const dObj = new Date(dateStr + 'T00:00:00');
      const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({
        dateStr,
        dayNum: day,
        dayName,
        isSunday: classification.isSunday,
        isNH: classification.isNH,
        title: classification.title
      });
    }
    return dates;
  }, [selectedMonth, selectedYear, daysInMonth, holidayRecords]);

  // Monthly aggregated staff attendance with detailed breakdown
  const monthlyStaffSummary = useMemo(() => {
    return allStaffList.map((staff, idx) => {
      const dailyMap: Record<number, AttendanceStatus> = {};
      let presentCount = 0;
      let absentCount = 0;
      let restCount = 0;
      let offCount = 0;
      let nhCount = 0;
      let crCount = 0;
      let odCount = 0;
      
      // Permanent leaves
      let lapCount = 0;
      let lhapCount = 0;
      let clCount = 0;
      let rhCount = 0;
      let plCount = 0;
      let medCount = 0;
      
      // Outsource leave
      let generalLeaveCount = 0;

      const absentDates: number[] = [];
      const leaveBreakdownList: string[] = [];

      monthDates.forEach(d => {
        const key = `${d.dateStr}_${staff.id}`;
        const rec = attendanceRecords.find(r => r.id === key);
        let st: AttendanceStatus;
        if (rec) {
          st = rec.status;
        } else if (d.isNH) {
          st = 'NH';
        } else if (d.isSunday) {
          st = 'REST';
        } else {
          st = 'P'; // Default present if not explicitly marked absent
        }

        dailyMap[d.dayNum] = st;
        if (st === 'P') presentCount++;
        else if (st === 'A') {
          absentCount++;
          absentDates.push(d.dayNum);
        } else if (st === 'REST' || st === 'WO') restCount++;
        else if (st === 'OFF') offCount++;
        else if (st === 'NH') nhCount++;
        else if (st === 'CR') crCount++;
        else if (st === 'OD') odCount++;
        else if (st === 'LAP') { lapCount++; leaveBreakdownList.push(`LAP:${d.dayNum}`); }
        else if (st === 'LHAP') { lhapCount++; leaveBreakdownList.push(`LHAP:${d.dayNum}`); }
        else if (st === 'CL') { clCount++; leaveBreakdownList.push(`CL:${d.dayNum}`); }
        else if (st === 'RH') { rhCount++; leaveBreakdownList.push(`RH:${d.dayNum}`); }
        else if (st === 'PL') { plCount++; leaveBreakdownList.push(`PL:${d.dayNum}`); }
        else if (st === 'MED') { medCount++; leaveBreakdownList.push(`MED:${d.dayNum}`); }
        else if (st === 'L') { generalLeaveCount++; leaveBreakdownList.push(`L:${d.dayNum}`); }
      });

      // Total paid/payable days as per railway rules
      const totalLeaveDays = lapCount + lhapCount + clCount + rhCount + plCount + medCount + generalLeaveCount;
      const payableDays = presentCount + restCount + nhCount + crCount + odCount + lapCount + lhapCount + clCount + rhCount + plCount + medCount;

      return {
        srNo: idx + 1,
        staff,
        dailyMap,
        presentCount,
        absentCount,
        restCount,
        offCount,
        nhCount,
        crCount,
        odCount,
        lapCount,
        lhapCount,
        clCount,
        rhCount,
        plCount,
        medCount,
        generalLeaveCount,
        totalLeaveDays,
        payableDays,
        absentDates,
        leaveBreakdownList
      };
    });
  }, [allStaffList, monthDates, attendanceRecords]);

  // Monthly grouped data by category
  const groupedMonthlyData = useMemo(() => {
    const isAll = selectedMonthlyCategory === "ALL";
    const groups: {
      key: string;
      label: string;
      icon: string;
      rows: typeof monthlyStaffSummary;
      subtotals: {
        totalStaff: number;
        present: number;
        absent: number;
        rest: number;
        nh: number;
        leaves: number;
        payable: number;
      };
    }[] = [];

    const categoryDefinitions = [
      { key: "PERMANENT", label: "1. Permanent Staff", icon: "🏛️", filter: (s: any) => s.category === 'PERMANENT' },
      { key: "OFFICE_STAFF", label: "2. Office Staff (Sweeper, Office boy)", icon: "🏢", filter: (s: any) => s.category === 'OFFICE_STAFF' },
      { key: "OUTSOURCE_GANG", label: "3. Outsource Staff (MTS outsource, Mate)", icon: "🛠️", filter: (s: any) => s.category === 'OUTSOURCE' || s.category === 'OUTSOURCE_GANG' },
      { key: "KEYMAN", label: "4. Keymen (Track Maintenance)", icon: "🔑", filter: (s: any) => s.category === 'KEYMAN' || (s.designation || '').toLowerCase().includes('keyman') },
      { key: "PATROL", label: "5. Patrolmen (Day / Night Security)", icon: "🛡️", filter: (s: any) => s.category === 'PATROL' || (s.designation || '').toLowerCase().includes('patrol') },
      { key: "GATEMAN", label: "6. Gatemen (Level Crossings)", icon: "🚦", filter: (s: any) => s.category === 'GATEMAN' || (s.designation || '').toLowerCase().includes('gateman') },
      { key: "WATCHMAN", label: "7. Bridge Watchmen (Special Surveillance)", icon: "🌉", filter: (s: any) => s.category === 'WATCHMAN' || (s.designation || '').toLowerCase().includes('watchman') },
      { key: "EX_SERVICEMAN", label: "Ex-Servicemen Roster", icon: "🎖️", filter: (s: any) => ['KEYMAN', 'PATROL', 'GATEMAN', 'WATCHMAN', 'EX_SERVICEMAN'].includes(s.category) }
    ];

    categoryDefinitions.forEach(catDef => {
      if (isAll || selectedMonthlyCategory === catDef.key) {
        const rows = monthlyStaffSummary.filter(r => catDef.filter(r.staff));
        if (rows.length > 0) {
          const subtotals = {
            totalStaff: rows.length,
            present: rows.reduce((a, b) => a + b.presentCount, 0),
            absent: rows.reduce((a, b) => a + b.absentCount, 0),
            rest: rows.reduce((a, b) => a + b.restCount, 0),
            nh: rows.reduce((a, b) => a + b.nhCount, 0),
            leaves: rows.reduce((a, b) => a + b.totalLeaveDays, 0),
            payable: rows.reduce((a, b) => a + b.payableDays, 0)
          };
          groups.push({
            key: catDef.key,
            label: catDef.label,
            icon: catDef.icon,
            rows,
            subtotals
          });
        }
      }
    });

    return groups;
  }, [monthlyStaffSummary, selectedMonthlyCategory]);

  // Export CSV of the Monthly Absentee Statement (Category-Wise)
  const exportMonthlyCsv = () => {
    const monthName = MONTH_NAMES[selectedMonth];
    const headers = [
      "Category Group",
      "Sr No",
      "Staff Name",
      "Designation",
      "Category",
      "Employment",
      "AWPO / Emp ID",
      "Phone",
      "Beat / Section",
      ...monthDates.map(d => `Day ${d.dayNum} (${d.dayName})`),
      "Calendar Days",
      "Present (P)",
      "Absent (A)",
      "Rest (REST)",
      "Off (OFF)",
      "NH",
      "CR",
      "OD",
      "LAP",
      "LHAP",
      "CL",
      "RH",
      "PL",
      "MED",
      "Leave (L)",
      "Payable Days",
      "Absent Dates List",
      "Leave Dates List"
    ];

    const rows: (string | number)[][] = [];

    groupedMonthlyData.forEach(group => {
      // Category Divider
      rows.push([
        `*** CATEGORY: ${group.label.toUpperCase()} (${group.subtotals.totalStaff} STAFF) ***`,
        "", "", "", "", "", "", "", "",
        ...monthDates.map(() => ""),
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ]);

      group.rows.forEach((row, rIdx) => {
        rows.push([
          `"${group.label}"`,
          rIdx + 1,
          `"${row.staff.name}"`,
          `"${row.staff.designation}"`,
          `"${row.staff.categoryLabel}"`,
          `"${row.staff.isPermanent ? "Permanent" : "Outsource"}"`,
          `"${row.staff.awpoId}"`,
          `"${row.staff.phone}"`,
          `"${row.staff.beatOrSection}"`,
          ...monthDates.map(d => row.dailyMap[d.dayNum] || "P"),
          daysInMonth,
          row.presentCount,
          row.absentCount,
          row.restCount,
          row.offCount,
          row.nhCount,
          row.crCount,
          row.odCount,
          row.lapCount,
          row.lhapCount,
          row.clCount,
          row.rhCount,
          row.plCount,
          row.medCount,
          row.generalLeaveCount,
          row.payableDays,
          `"${row.absentDates.join(", ") || "NIL"}"`,
          `"${row.leaveBreakdownList.join(", ") || "NIL"}"`
        ]);
      });

      // Category Subtotal Row
      rows.push([
        `"${group.label} SUB-TOTAL"`,
        "", "", "", "", "", "", "", "",
        ...monthDates.map(() => "-"),
        daysInMonth * group.subtotals.totalStaff,
        group.subtotals.present,
        group.subtotals.absent,
        group.subtotals.rest,
        "-",
        group.subtotals.nh,
        "-", "-", "-", "-", "-", "-", "-", "-",
        group.subtotals.leaves,
        group.subtotals.payable,
        "-", "-"
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const catSuffix = selectedMonthlyCategory === "ALL" ? "All_Categories" : selectedMonthlyCategory;
    link.setAttribute("download", `DFCCIL_Absentee_Statement_${catSuffix}_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeStyle = (st: AttendanceStatus) => {
    switch (st) {
      case 'P':
        return 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200';
      case 'A':
        return 'bg-red-500 text-white font-bold';
      case 'L':
        return 'bg-amber-100 text-amber-900 font-bold border border-amber-300';
      case 'LAP':
        return 'bg-cyan-100 text-cyan-900 font-bold border border-cyan-300';
      case 'LHAP':
        return 'bg-teal-100 text-teal-900 font-bold border border-teal-300';
      case 'CL':
        return 'bg-amber-100 text-amber-900 font-bold border border-amber-300';
      case 'RH':
        return 'bg-orange-100 text-orange-900 font-bold border border-orange-300';
      case 'PL':
        return 'bg-pink-100 text-pink-900 font-bold border border-pink-300';
      case 'MED':
        return 'bg-rose-100 text-rose-900 font-bold border border-rose-300';
      case 'OFF':
        return 'bg-slate-200 text-slate-800 font-bold border border-slate-300';
      case 'REST':
      case 'WO':
        return 'bg-blue-100 text-blue-900 font-bold border border-blue-300';
      case 'NH':
        return 'bg-purple-100 text-purple-900 font-bold border border-purple-300';
      case 'CR':
        return 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-300';
      case 'OD':
        return 'bg-violet-100 text-violet-900 font-bold border border-violet-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 print-container">
      {/* Top Brand Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Daily Attendance &amp; Absentee ERP</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-[#123b72] border border-blue-200 uppercase">
                Official Roster
              </span>
            </div>
            <p className="text-xs text-slate-500">
              DFCCIL IMSD SMUN · Daily Roll Call, Sunday/NH &amp; Leave Tagging, Complete Month-End Absentee Statement
            </p>
          </div>
        </div>

        {/* Global Tab Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'daily'
                ? 'bg-[#123b72] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'monthly'
                ? 'bg-[#123b72] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Monthly Absentee Statement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('holidays')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'holidays'
                ? 'bg-[#123b72] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NH &amp; Rest Days</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          TAB 1: DAILY ATTENDANCE ROSTER
      ---------------------------------------------------------------------- */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Selector & Day Declaration Power Bar */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Select Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Day status badge */}
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  currentDateInfo.isNH
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : currentDateInfo.isSunday
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {currentDateInfo.isNH ? '🎉 ' : currentDateInfo.isSunday ? '☕ ' : '🟢 '}
                  <span>{currentDateInfo.title}</span>
                </span>
              </div>

              {/* Day Declaration Admin Controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Declare Day:</span>
                <button
                  type="button"
                  onClick={() => handleDeclareDayType('NORMAL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    !currentDateInfo.isHoliday
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  🟢 Working Day
                </button>
                <button
                  type="button"
                  onClick={() => handleDeclareDayType('SUNDAY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    currentDateInfo.type === 'SUNDAY'
                      ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  ☕ Sunday / Rest
                </button>
                <button
                  type="button"
                  onClick={() => handleDeclareDayType('NH')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    currentDateInfo.isNH
                      ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                  }`}
                >
                  🎉 National Holiday (NH)
                </button>
              </div>
            </div>

            
            {/* 🔒 4-Day Historical Lock Alert Banner */}
            {isDateLockedForNonAdmin && (
              <div className="p-3.5 bg-amber-50 text-amber-900 border-2 border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 font-bold">
                  <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>🔒 Attendance Record Locked: {selectedDate} ki attendance 4 din se purani hai. Policy ke anusar purane records me badlav restricted hai. Yeh record kewal APM / Civil (Shri Vivek Kumar Azad, Super Admin ID) ke login se hi unlock aur edit kiya ja sakta hai.</span>
                </div>
                <span className="px-2.5 py-1 bg-amber-200 text-amber-950 font-black rounded-lg font-mono text-[10px] whitespace-nowrap shadow-sm">
                  🔒 LOCKED (&gt; 4 DAYS)
                </span>
              </div>
            )}

            {isSuperAdmin && (
              <div className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 text-xs shadow-sm">
                <div className="flex items-center gap-2 font-bold">
                  <Unlock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>🔓 Super Admin Override Active: Logged in as APM / Civil (Shri Vivek Kumar Azad). All past attendance dates (&gt; 4 days) are fully unlocked for administrative editing.</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-950 font-black rounded-md font-mono text-[9px] whitespace-nowrap">
                  APM UNLOCKED
                </span>
              </div>
            )}

            {/* Attendance Metrics Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Staff</span>
                <span className="text-xl font-black text-slate-900 font-mono">{dailyMetrics.total}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Present (P)</span>
                <span className="text-xl font-black text-emerald-900 font-mono">{dailyMetrics.p}</span>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                <span className="text-[10px] text-red-700 font-bold block uppercase">Absent (A)</span>
                <span className="text-xl font-black text-red-900 font-mono">{dailyMetrics.a}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <span className="text-[10px] text-amber-700 font-bold block uppercase">Leaves (LAP/CL/L)</span>
                <span className="text-xl font-black text-amber-900 font-mono">{dailyMetrics.l}</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <span className="text-[10px] text-blue-700 font-bold block uppercase">Rest / Sunday</span>
                <span className="text-xl font-black text-blue-900 font-mono">{dailyMetrics.rest}</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
                <span className="text-[10px] text-purple-700 font-bold block uppercase">Holiday (NH)</span>
                <span className="text-xl font-black text-purple-900 font-mono">{dailyMetrics.nh}</span>
              </div>
              <div className="bg-violet-50 border border-violet-200 p-3 rounded-xl">
                <span className="text-[10px] text-violet-700 font-bold block uppercase">Duty / Tour (OD)</span>
                <span className="text-xl font-black text-violet-900 font-mono">{dailyMetrics.od}</span>
              </div>
            </div>

            {/* Quick Bulk Marking Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-bold text-[11px]">Quick Bulk Mark:</span>
                <button
                  type="button"
                  onClick={() => handleBulkMark('P', 'Normal Duty')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-sm"
                >
                  ✓ Mark All Present (P)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkMark('A', 'Unauthorized Absent')}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition shadow-sm"
                >
                  ✕ Mark All Absent (A)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkMark('REST', 'Sunday Rest')}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-sm"
                >
                  ☕ Mark All Rest (REST)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkMark('NH', currentDateInfo.title)}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition shadow-sm"
                >
                  🎉 Mark All Holiday (NH)
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Name, ID, or Section..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="PERMANENT">Permanent Staff</option>
                <option value="OUTSOURCE">Outsource</option>
                <option value="KEYMAN">Keyman</option>
                <option value="PATROL">Patrolman</option>
                <option value="GATEMAN">Gateman</option>
                <option value="WATCHMAN">Watchman</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Attendance Statuses</option>
                <option value="P">Present (P)</option>
                <option value="A">Absent (A)</option>
                <option value="REST">Rest / Sunday (REST)</option>
                <option value="LAP">LAP</option>
                <option value="LHAP">LHAP</option>
                <option value="CL">CL</option>
                <option value="RH">RH</option>
                <option value="PL">Paternity Leave (PL)</option>
                <option value="MED">Medical Leave (MED)</option>
                <option value="OFF">Off</option>
                <option value="NH">National Holiday (NH)</option>
                <option value="CR">Compensatory Rest (CR)</option>
                <option value="OD">On Duty (OD)</option>
                <option value="L">Leave (L)</option>
              </select>
            </div>
          </div>

          {/* Daily Attendance Table with Horizontal Slider */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full max-w-full scrollbar-thin scrollbar-thumb-slate-300">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 min-w-[240px]">Staff Member (Name, ID, Designation)</th>
                    <th className="p-3 min-w-[320px]">Mark Status</th>
                    <th className="p-3 min-w-[140px]">Remarks</th>
                    <th className="p-3 text-right min-w-[120px]">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDailyStaff.map((staff, idx) => {
                    const { status, remarks } = getStaffStatus(staff);
                    const cleanPhone = (staff.phone || '').replace(/[^0-9]/g, '');
                    const statusOptions = staff.isPermanent ? PERMANENT_STATUS_OPTIONS : OUTSOURCE_STATUS_OPTIONS;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                        
                        {/* Streamlined Combined Staff Info (Name, AWPO/Emp ID, Designation) */}
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => setSelectedStaffForModal({
                                name: staff.name,
                                awpoId: staff.awpoId,
                                mobileNo: staff.phone,
                                post: staff.designation,
                                fatherName: staff.fatherName,
                                residence: staff.residence,
                                district: staff.district,
                                category: staff.categoryLabel as any,
                                photoUrl: staff.photoUrl
                              })}
                              className="font-black text-sm text-slate-900 hover:text-blue-700 hover:underline text-left inline-flex items-center gap-1.5"
                            >
                              <span>{staff.name}</span>
                            </button>
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-mono text-[10px] bg-blue-50 text-[#0f2b5c] font-black px-1.5 py-0.5 rounded border border-blue-200">
                                {staff.awpoId}
                              </span>
                              <span className="text-slate-600 font-bold text-xs">
                                {staff.designation}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Interactive Status Selector customized per category */}
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {statusOptions.map(opt => {
                              const isSelected = status === opt.status;
                              return (
                                <button
                                  key={opt.status}
                                  type="button"
                                  onClick={() => handleMarkStaffStatus(staff, opt.status)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition border ${
                                    isSelected
                                      ? opt.activeClass
                                      : `${opt.colorClass} border-transparent`
                                  }`}
                                  title={opt.label}
                                >
                                  {opt.short}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        <td className="p-3">
                          <input
                            type="text"
                            defaultValue={remarks}
                            onBlur={e => handleMarkStaffStatus(staff, status, e.target.value)}
                            placeholder="Remarks..."
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 w-full focus:bg-white focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedStaffForModal({
                                name: staff.name,
                                awpoId: staff.awpoId,
                                mobileNo: staff.phone,
                                post: staff.designation,
                                category: staff.categoryLabel as any,
                                photoUrl: staff.photoUrl
                              })}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-200 hover:bg-blue-100"
                            >
                              🪪 ID
                            </button>
                            {staff.phone && staff.phone !== '-' && (
                              <>
                                <a
                                  href={`tel:${staff.phone}`}
                                  className="p-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100"
                                  title="Call Staff"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100"
                                  title="WhatsApp Message"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </>
                            )}
                          </div>
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
          TAB 2: MONTHLY ABSENTEE STATEMENT (CATEGORY-WISE)
      ---------------------------------------------------------------------- */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {/* Month/Year Selector & Category Filter Bar */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Statement Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    {[2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-slate-600 font-mono">
                  {daysInMonth} Calendar Days · {monthDates.filter(d => d.isSunday).length} Sundays · {monthDates.filter(d => d.isNH).length} Gazetted NH
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportMonthlyCsv}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Category CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#123b72] hover:bg-[#1a4f9c] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter Category:
              </span>
              {MONTHLY_CATEGORY_GROUPS.map(cat => {
                const count = cat.key === "ALL"
                  ? allStaffList.length
                  : allStaffList.filter(s => s.category === cat.key).length;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedMonthlyCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedMonthlyCategory === cat.key
                        ? "bg-[#123b72] text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      selectedMonthlyCategory === cat.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Staff</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.totalStaff, 0)} Personnel
              </span>
            </div>

            <div className="bg-white border border-emerald-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">Total Present Days</span>
              <span className="text-lg font-black text-emerald-800 font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.present, 0)} Days
              </span>
            </div>

            <div className="bg-white border border-red-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-red-700 font-bold block uppercase">Total Absent Days</span>
              <span className="text-lg font-black text-red-800 font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.absent, 0)} Days
              </span>
            </div>

            <div className="bg-white border border-blue-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-blue-700 font-bold block uppercase">Rest / Off Days</span>
              <span className="text-lg font-black text-blue-800 font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.rest, 0)} Days
              </span>
            </div>

            <div className="bg-white border border-amber-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-amber-700 font-bold block uppercase">Leave Availed</span>
              <span className="text-lg font-black text-amber-800 font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.leaves, 0)} Days
              </span>
            </div>

            <div className="bg-white border border-purple-200 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-purple-700 font-bold block uppercase">Total Payable Days</span>
              <span className="text-lg font-black text-purple-900 font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.payable, 0)} Days
              </span>
            </div>
          </div>

          {/* Official Printable Statement */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="text-center border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-[#123b72] text-white text-[10px] font-bold rounded">DFCCIL IMSD SMUN</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">CIVIL / P-WAY</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Category-Wise Monthly Absentee Statement</h3>
              <p className="text-xs text-slate-600 font-mono">
                Month: {MONTH_NAMES[selectedMonth]} {selectedYear} · Section: Km 1167.210 – 1249.720 · Category: {selectedMonthlyCategory === "ALL" ? "All Categories (Consolidated)" : MONTHLY_CATEGORY_GROUPS.find(g => g.key === selectedMonthlyCategory)?.label}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] text-slate-800 border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="p-2 border border-slate-300 w-8">#</th>
                    <th className="p-2 border border-slate-300 min-w-[130px]">Staff Name</th>
                    <th className="p-2 border border-slate-300 min-w-[100px]">Designation</th>
                    <th className="p-2 border border-slate-300 min-w-[80px]">Category</th>
                    <th className="p-2 border border-slate-300 min-w-[80px]">AWPO / ID</th>
                    {monthDates.map(d => (
                      <th
                        key={d.dayNum}
                        className={`p-1 border border-slate-300 text-center font-mono text-[10px] w-6 ${
                          d.isNH
                            ? "bg-purple-100 text-purple-900 font-black"
                            : d.isSunday
                            ? "bg-blue-100 text-blue-900 font-black"
                            : "bg-slate-50"
                        }`}
                        title={`${d.dayName} ${d.dayNum}: ${d.title}`}
                      >
                        <div>{d.dayNum}</div>
                        <div className="text-[8px] opacity-75">{d.dayName[0]}</div>
                      </th>
                    ))}
                    <th className="p-1.5 border border-slate-300 text-center bg-emerald-50 text-emerald-900 font-bold">P</th>
                    <th className="p-1.5 border border-slate-300 text-center bg-red-50 text-red-900 font-bold">A</th>
                    <th className="p-1.5 border border-slate-300 text-center bg-blue-50 text-blue-900 font-bold">REST</th>
                    <th className="p-1.5 border border-slate-300 text-center bg-purple-50 text-purple-900 font-bold">NH</th>
                    <th className="p-1.5 border border-slate-300 text-center bg-amber-50 text-amber-900 font-bold">Leaves</th>
                    <th className="p-1.5 border border-slate-300 text-center bg-slate-200 text-slate-900 font-black">Payable</th>
                    <th className="p-1.5 border border-slate-300 min-w-[140px]">Absent / Leave Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedMonthlyData.map((group, gIdx) => (
                    <React.Fragment key={group.key}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-200/90 text-slate-900 font-black border-y-2 border-slate-400">
                        <td colSpan={monthDates.length + 12} className="p-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs uppercase tracking-wide">
                              <span>{group.icon}</span>
                              <span>{gIdx + 1}. {group.label}</span>
                              <span className="px-2 py-0.5 bg-[#123b72] text-white rounded text-[10px] font-mono">
                                {group.subtotals.totalStaff} Personnel
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-600">
                              Sub-Total: {group.subtotals.present} Present · {group.subtotals.absent} Absent · {group.subtotals.payable} Payable Days
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Staff Rows in this Category */}
                      {group.rows.map((row, rIdx) => (
                        <tr key={row.staff.id} className="hover:bg-slate-50 transition font-sans">
                          <td className="p-1.5 border border-slate-300 text-slate-500 font-mono text-center">{rIdx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{row.staff.name}</td>
                          <td className="p-1.5 border border-slate-300 text-slate-700">{row.staff.designation}</td>
                          <td className="p-1.5 border border-slate-300">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.staff.isPermanent ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-800"}`}>
                              {row.staff.isPermanent ? "Permanent" : "Outsource"}
                            </span>
                          </td>
                          <td className="p-1.5 border border-slate-300 font-mono text-slate-600">{row.staff.awpoId}</td>
                          {monthDates.map(d => {
                            const val = row.dailyMap[d.dayNum] || "P";
                            const badgeStyle = getStatusBadgeStyle(val);
                            return (
                              <td
                                key={d.dayNum}
                                className={`p-0.5 border border-slate-300 text-center font-mono text-[9px] ${badgeStyle}`}
                                title={`Day ${d.dayNum}: ${val}`}
                              >
                                {val}
                              </td>
                            );
                          })}
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-800 bg-emerald-50/50">{row.presentCount}</td>
                          <td className={`p-1.5 border border-slate-300 text-center font-black ${row.absentCount > 0 ? "bg-red-100 text-red-900 font-mono" : "text-slate-400"}`}>
                            {row.absentCount}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-blue-800">{row.restCount}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-purple-800">{row.nhCount}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-amber-800 bg-amber-50/50">
                            {row.totalLeaveDays}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono font-black text-slate-900 bg-slate-100">
                            {row.payableDays}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-[10px]">
                            {row.absentDates.length > 0 && (
                              <div className="text-red-700 font-bold">
                                Absent: {row.absentDates.join(", ")} ({row.absentDates.length}d)
                              </div>
                            )}
                            {row.leaveBreakdownList.length > 0 && (
                              <div className="text-amber-800 font-medium">
                                {row.leaveBreakdownList.join("; ")}
                              </div>
                            )}
                            {row.absentDates.length === 0 && row.leaveBreakdownList.length === 0 && (
                              <span className="text-emerald-700 font-medium">NIL (Full Attendance)</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* Category Subtotal Row */}
                      <tr className="bg-slate-100 font-bold border-b-2 border-slate-300 text-slate-900">
                        <td colSpan={5} className="p-1.5 border border-slate-300 text-right pr-3 text-xs">
                          {group.label} Sub-Total:
                        </td>
                        <td colSpan={monthDates.length} className="p-1.5 border border-slate-300 text-center text-slate-400 font-mono">
                          —
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center text-emerald-800 font-mono font-black">{group.subtotals.present}</td>
                        <td className="p-1.5 border border-slate-300 text-center text-red-800 font-mono font-black">{group.subtotals.absent}</td>
                        <td className="p-1.5 border border-slate-300 text-center text-blue-800 font-mono font-black">{group.subtotals.rest}</td>
                        <td className="p-1.5 border border-slate-300 text-center text-purple-800 font-mono font-black">{group.subtotals.nh}</td>
                        <td className="p-1.5 border border-slate-300 text-center text-amber-800 font-mono font-black">{group.subtotals.leaves}</td>
                        <td className="p-1.5 border border-slate-300 text-center text-slate-900 font-mono font-black bg-slate-200">{group.subtotals.payable}</td>
                        <td className="p-1.5 border border-slate-300 text-[10px] text-slate-600 font-mono">
                          {group.subtotals.totalStaff} staff in {group.label}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}

                  {/* Grand Consolidated Total Row */}
                  <tr className="bg-[#123b72] text-white font-black text-xs border-t-2 border-slate-900">
                    <td colSpan={5} className="p-2 border border-slate-400 text-right pr-3 uppercase">
                      Grand Total (All Categories):
                    </td>
                    <td colSpan={monthDates.length} className="p-2 border border-slate-400 text-center text-blue-200 font-mono">
                      {daysInMonth} Days in Month
                    </td>
                    <td className="p-2 border border-slate-400 text-center font-mono font-black bg-emerald-800 text-white">
                      {groupedMonthlyData.reduce((a, b) => a + b.subtotals.present, 0)}
                    </td>
                    <td className="p-2 border border-slate-400 text-center font-mono font-black bg-red-800 text-white">
                      {groupedMonthlyData.reduce((a, b) => a + b.subtotals.absent, 0)}
                    </td>
                    <td className="p-2 border border-slate-400 text-center font-mono font-black bg-blue-800 text-white">
                      {groupedMonthlyData.reduce((a, b) => a + b.subtotals.rest, 0)}
                    </td>
                    <td className="p-2 border border-slate-400 text-center font-mono font-black bg-purple-800 text-white">
                      {groupedMonthlyData.reduce((a, b) => a + b.subtotals.nh, 0)}
                    </td>
                    <td className="p-2 border border-slate-400 text-center font-mono font-black bg-amber-800 text-white">
                      {groupedMonthlyData.reduce((a, b) => a + b.subtotals.leaves, 0)}
                    </td>
                    <td className="p-2 border border-slate-400 text-center font-mono font-black bg-slate-900 text-white">
                      {groupedMonthlyData.reduce((a, b) => a + b.subtotals.payable, 0)}
                    </td>
                    <td className="p-2 border border-slate-400 text-[10px] text-blue-100">
                      Total Staff: {groupedMonthlyData.reduce((a, b) => a + b.subtotals.totalStaff, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


{/* ---------------------------------------------------------------------
          TAB 3: HOLIDAY MASTER
      ---------------------------------------------------------------------- */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">NH & Rest Day Calendar Master</h3>
              <p className="text-xs text-slate-500">Manage official Gazetted holidays and special rest days.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddHolidayModalOpen(true)}
              className="px-4 py-2 bg-[#123b72] hover:bg-[#1a4f9c] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Declare New Holiday</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Gazetted 2026 Holidays */}
            {Object.entries(DEFAULT_HOLIDAYS_2026).map(([date, title]) => (
              <div key={date} className="bg-white border border-purple-200 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono font-bold text-xs">
                    {date}
                  </span>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                    Gazetted 2026
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                <p className="text-[11px] text-slate-500">Indian Railways / DFCCIL Master Calendar</p>
              </div>
            ))}

            {/* Custom Declared Holidays */}
            {holidayRecords.map(h => (
              <div key={h.id} className="bg-white border border-blue-200 p-4 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono font-bold text-xs">
                      {h.date}
                    </span>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                      Custom Declaration ({h.type})
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{h.title}</h4>
                  {h.remarks && <p className="text-[11px] text-slate-500 mt-0.5">{h.remarks}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">By: {h.declaredBy || 'Admin'}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Declare National Holiday / Rest Day</h3>
              <button onClick={() => setIsAddHolidayModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveHolidayForm} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={holidayFormData.date}
                  onChange={e => setHolidayFormData({ ...holidayFormData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Holiday Title / Occasion</label>
                <input
                  type="text"
                  required
                  value={holidayFormData.title}
                  onChange={e => setHolidayFormData({ ...holidayFormData, title: e.target.value })}
                  placeholder="e.g. Haryana Day, Special Mega Block Rest"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Holiday Category</label>
                <select
                  value={holidayFormData.type}
                  onChange={e => setHolidayFormData({ ...holidayFormData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="NH">National Holiday (NH)</option>
                  <option value="REST">Rest Day</option>
                  <option value="SUNDAY">Sunday Rest</option>
                  <option value="SPECIAL">Special Observance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remarks / Reference Circular</label>
                <input
                  type="text"
                  value={holidayFormData.remarks}
                  onChange={e => setHolidayFormData({ ...holidayFormData, remarks: e.target.value })}
                  placeholder="Optional reference"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#123b72] hover:bg-[#1a4f9c] text-white rounded-xl font-bold shadow-sm"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff ID Card Modal */}
      {selectedStaffForModal && (
        <StaffIdModal
          staff={selectedStaffForModal}
          isOpen={Boolean(selectedStaffForModal)}
          onClose={() => setSelectedStaffForModal(null)}
        />
      )}
    </div>
  );
};
