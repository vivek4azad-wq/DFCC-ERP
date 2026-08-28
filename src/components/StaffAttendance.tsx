import { CANONICAL_SMUN_84_STAFF, type CanonicalStaffMember } from "../data/canonicalStaffRoster.ts";
const MONTHLY_CATEGORY_GROUPS = [
  { key: "PERMANENT", label: "1. Permanent Staff", icon: "🏛️" },
  { key: "KEYMAN", label: "2. Keymen Beats (17)", icon: "🔑" },
  { key: "PATROL_DAY", label: "3. Day Patrolmen (दिन की पेट्रोलिंग)", icon: "☀️" },
  { key: "PATROL_NIGHT", label: "4. Night Patrolmen (रात की पेट्रोलिंग)", icon: "🌙" },
  { key: "GATEMAN", label: "5. Gatemen (19 Posts)", icon: "🚦" },
  { key: "WATCHMAN", label: "6. Bridge Watchmen (3)", icon: "🌉" },
  { key: "OUTSOURCE_GANG", label: "7. Outsource MTS (आउटसोर्स एमटीएस)", icon: "🛠️" },
  { key: "OFFICE_STAFF", label: "8. Office Staff (Sweeper/Boy)", icon: "🏢" },
  { key: "ALL", label: "All Categories (Consolidated)", icon: "📊" }
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  FileText,
  Shield,
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
  category: 'PERMANENT' | 'OFFICE_STAFF' | 'OUTSOURCE_GANG' | 'EX_SERVICEMAN' | 'KEYMAN' | 'PATROL' | 'PATROL_DAY' | 'PATROL_NIGHT' | 'GATEMAN' | 'WATCHMAN' | 'OUTSOURCE';
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
  { status: 'P', label: 'Present', short: 'P', colorClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800', activeClass: 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-bold' },
  { status: 'REST', label: 'Rest / Sunday', short: 'REST', colorClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800', activeClass: 'bg-blue-600 text-white ring-2 ring-blue-400 font-bold' },
  { status: 'LAP', label: 'Leave on Average Pay (LAP)', short: 'LAP', colorClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border-cyan-200 dark:border-cyan-800', activeClass: 'bg-cyan-700 text-white ring-2 ring-cyan-400 font-bold' },
  { status: 'LHAP', label: 'Leave on Half Average Pay (LHAP)', short: 'LHAP', colorClass: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border-teal-200 dark:border-teal-800', activeClass: 'bg-teal-700 text-white ring-2 ring-teal-400 font-bold' },
  { status: 'CL', label: 'Casual Leave (CL)', short: 'CL', colorClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-200 dark:border-amber-800', activeClass: 'bg-amber-600 text-white ring-2 ring-amber-400 font-bold' },
  { status: 'RH', label: 'Restricted Holiday (RH)', short: 'RH', colorClass: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60 border-orange-200 dark:border-orange-800', activeClass: 'bg-orange-600 text-white ring-2 ring-orange-400 font-bold' },
  { status: 'PL', label: 'Paternity / Maternity Leave (PL)', short: 'PL', colorClass: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/60 border-pink-200 dark:border-pink-800', activeClass: 'bg-pink-600 text-white ring-2 ring-pink-400 font-bold' },
  { status: 'OFF', label: 'Scheduled Off', short: 'OFF', colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700', activeClass: 'bg-slate-700 dark:bg-slate-600 text-white ring-2 ring-slate-400 font-bold' },
  { status: 'NH', label: 'National Holiday (NH)', short: 'NH', colorClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border-purple-200 dark:border-purple-800', activeClass: 'bg-purple-600 text-white ring-2 ring-purple-400 font-bold' },
  { status: 'CR', label: 'Compensatory Rest (CR)', short: 'CR', colorClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border-indigo-200 dark:border-indigo-800', activeClass: 'bg-indigo-600 text-white ring-2 ring-indigo-400 font-bold' },
  { status: 'MED', label: 'Medical / Sick Leave (MED)', short: 'MED', colorClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-rose-200 dark:border-rose-800', activeClass: 'bg-rose-600 text-white ring-2 ring-rose-400 font-bold' },
  { status: 'OD', label: 'On Duty / Tour (OD)', short: 'OD', colorClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 border-violet-200 dark:border-violet-800', activeClass: 'bg-violet-600 text-white ring-2 ring-violet-400 font-bold' },
  { status: 'A', label: 'Absent (Unauthorized)', short: 'A', colorClass: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 border-red-200 dark:border-red-800', activeClass: 'bg-red-600 text-white ring-2 ring-red-400 font-bold' },
];

// Outsource Status Options Definition
const OUTSOURCE_STATUS_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  short: string;
  colorClass: string;
  activeClass: string;
}[] = [
  { status: 'P', label: 'Present', short: 'P', colorClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800', activeClass: 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-bold' },
  { status: 'L', label: 'Leave', short: 'L', colorClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-200 dark:border-amber-800', activeClass: 'bg-amber-600 text-white ring-2 ring-amber-400 font-bold' },
  { status: 'REST', label: 'Weekly Rest', short: 'REST', colorClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800', activeClass: 'bg-blue-600 text-white ring-2 ring-blue-400 font-bold' },
  { status: 'OFF', label: 'Shift Off', short: 'OFF', colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700', activeClass: 'bg-slate-700 dark:bg-slate-600 text-white ring-2 ring-slate-400 font-bold' },
  { status: 'CR', label: 'Compensatory Rest (CR)', short: 'CR', colorClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border-indigo-200 dark:border-indigo-800', activeClass: 'bg-indigo-600 text-white ring-2 ring-indigo-400 font-bold' },
  { status: 'NH', label: 'National Holiday (NH)', short: 'NH', colorClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border-purple-200 dark:border-purple-800', activeClass: 'bg-purple-600 text-white ring-2 ring-purple-400 font-bold' },
  { status: 'OD', label: 'On Duty (OD)', short: 'OD', colorClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 border-violet-200 dark:border-violet-800', activeClass: 'bg-violet-600 text-white ring-2 ring-violet-400 font-bold' },
  { status: 'A', label: 'Absent (Unauthorized)', short: 'A', colorClass: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 border-red-200 dark:border-red-800', activeClass: 'bg-red-600 text-white ring-2 ring-red-400 font-bold' },
];

const normalizeName = (name?: string): string => {
  if (!name) return '';
  return (name || '').replace(/^(shri|mr|sh\.)\s+/i, '').trim().toLowerCase();
};

const normalizePhone = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length > 10) return digits.slice(-10);
  return digits;
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

    if (cleanPhone && cleanPhone.length >= 10 && seenPhones.has(cleanPhone)) {
      continue;
    }
    if (cleanName && seenKeys.has(cleanName)) {
      continue;
    }
    if (cleanPhone && cleanPhone.length >= 10) seenPhones.add(cleanPhone);
    if (cleanName) seenKeys.add(cleanName);
    result.push(item);
  }
  return result;
}

export const StaffAttendance: React.FC = () => {
  const { currentUser, role, currentAppRole } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN' || currentAppRole === 'APM';
  const isOfficerUser = role === 'OFFICER' || currentAppRole === 'Executive';
  const isGuest = role === 'GUEST' || !currentUser;

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
  const [selectedMonthlyCategory, setSelectedMonthlyCategory] = useState<string>("PERMANENT");

  // Collections
  const [allStaffList, setAllStaffList] = useState<StaffRosterItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendanceRecord[]>([]);
  const [holidayRecords, setHolidayRecords] = useState<HolidayDeclarationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('PERMANENT');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Staff ID Modal
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<UnifiedStaffModalData | null>(null);

  // Leave Report Modal & Staff Search
  const [isLeaveReportModalOpen, setIsLeaveReportModalOpen] = useState(false);
  const [leaveSearchStaffQuery, setLeaveSearchStaffQuery] = useState('');
  const [selectedLeaveStaffId, setSelectedLeaveStaffId] = useState<string>('');

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
      const [attendances, holidays] = await Promise.all([
        db.getCollection<DailyAttendanceRecord>('staff_attendance'),
        db.getCollection<HolidayDeclarationRecord>('attendance_holidays')
      ]);

      const compiledStaff: StaffRosterItem[] = CANONICAL_SMUN_84_STAFF
        .filter(s => {
          if (isOfficerUser && s.id === 'OFF-101518') return false; // Privacy check for normal officer login
          return true;
        })
        .map(s => ({
          id: s.id,
          name: s.name,
          fatherName: s.fatherName,
          designation: s.designation,
          category: s.category as any,
          categoryLabel: s.categoryLabel,
          isPermanent: s.isPermanent,
          awpoId: s.awpoId,
          phone: s.phone,
          beatOrSection: s.beatOrSection,
          residence: s.residence,
          district: s.district,
          photoUrl: s.photoUrl
        }));

      setAllStaffList(compiledStaff);
      setAttendanceRecords(attendances || []);
      setHolidayRecords(holidays || []);
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
    if (isGuest) {
      alert('🔒 Guest View Only: Guest users have read-only access and cannot mark attendance. Only authorized Officers or Super Admin can record attendance.');
      return;
    }
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
    if (isGuest) {
      alert('🔒 Guest View Only: Guest users have read-only access and cannot mark attendance.');
      return;
    }
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
    if (isGuest) {
      alert('🔒 Guest View Only: Guest users have read-only access and cannot declare day types.');
      return;
    }
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
        } else if (filterVal === 'OUTSOURCE' || filterVal === 'OUTSOURCE_GANG') {
          if (s.isPermanent || sCat === 'PERMANENT') return false;
          if (sCat !== 'OUTSOURCE' && sCat !== 'OUTSOURCE_GANG' && sCat !== 'OFFICE_STAFF') return false;
        } else if (filterVal === 'KEYMAN') {
          if (sCat !== 'KEYMAN' && !des.includes('keyman') && !sec.includes('keyman')) return false;
        } else if (filterVal === 'PATROL_DAY') {
          if (sCat !== 'PATROL_DAY' && !des.includes('day patrol') && !sec.includes('spd')) return false;
        } else if (filterVal === 'PATROL_NIGHT') {
          if (sCat !== 'PATROL_NIGHT' && !des.includes('night patrol') && !sec.includes('spn') && !sec.includes('wp')) return false;
        } else if (filterVal === 'PATROL') {
          if (sCat !== 'PATROL' && sCat !== 'PATROL_DAY' && sCat !== 'PATROL_NIGHT' && !des.includes('patrol') && !sec.includes('spd') && !sec.includes('spn')) return false;
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
      const dailyMap: Record<number, AttendanceStatus | '-'> = {};
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
        const isFuture = d.dateStr > todayStr;
        let st: AttendanceStatus | '-';

        if (rec) {
          st = rec.status;
        } else if (isFuture) {
          st = '-'; // Future dates left blank (unrecorded)
        } else if (d.isNH) {
          st = 'NH';
        } else if (d.isSunday) {
          st = 'REST';
        } else {
          st = 'P'; // Default present for past/today if not explicitly marked absent
        }

        dailyMap[d.dayNum] = st;
        if (!isFuture || rec) {
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
        }
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
  }, [allStaffList, monthDates, attendanceRecords, todayStr]);

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
      { key: "PERMANENT", label: "1. Permanent Staff", icon: "🏛️", filter: (s: any) => s.category === 'PERMANENT' || s.isPermanent },
      { key: "KEYMAN", label: "2. Keymen (Track Maintenance)", icon: "🔑", filter: (s: any) => s.category === 'KEYMAN' || (s.designation || '').toLowerCase().includes('keyman') },
      { key: "PATROL_DAY", label: "3. Day Patrolmen (दिन की पेट्रोलिंग)", icon: "☀️", filter: (s: any) => s.category === 'PATROL_DAY' || ((s.category === 'PATROL' || (s.designation || '').toLowerCase().includes('patrol')) && ((s.designation || '').toLowerCase().includes('day') || (s.beatOrSection || '').toLowerCase().includes('spd'))) },
      { key: "PATROL_NIGHT", label: "4. Night Patrolmen (रात की पेट्रोलिंग)", icon: "🌙", filter: (s: any) => s.category === 'PATROL_NIGHT' || ((s.category === 'PATROL' || (s.designation || '').toLowerCase().includes('patrol')) && ((s.designation || '').toLowerCase().includes('night') || (s.beatOrSection || '').toLowerCase().includes('spn') || (s.beatOrSection || '').toLowerCase().includes('wp'))) },
      { key: "GATEMAN", label: "5. Gatemen (Level Crossings)", icon: "🚦", filter: (s: any) => s.category === 'GATEMAN' || (s.designation || '').toLowerCase().includes('gateman') || (s.beatOrSection || '').toLowerCase().includes('lc') },
      { key: "WATCHMAN", label: "6. Bridge Watchmen (Special Surveillance)", icon: "🌉", filter: (s: any) => s.category === 'WATCHMAN' || (s.designation || '').toLowerCase().includes('watchman') || (s.beatOrSection || '').toLowerCase().includes('bridge') },
      { key: "OUTSOURCE_GANG", label: "7. Outsource Staff (MTS outsource, Mate)", icon: "🛠️", filter: (s: any) => (s.category === 'OUTSOURCE' || s.category === 'OUTSOURCE_GANG') && !s.isPermanent },
      { key: "OFFICE_STAFF", label: "8. Office Staff (Sweeper, Office boy)", icon: "🏢", filter: (s: any) => s.category === 'OFFICE_STAFF' },
      { key: "EX_SERVICEMAN", label: "Ex-Servicemen Roster", icon: "🎖️", filter: (s: any) => ['KEYMAN', 'PATROL', 'PATROL_DAY', 'PATROL_NIGHT', 'GATEMAN', 'WATCHMAN', 'EX_SERVICEMAN'].includes(s.category) }
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

  // Selected Staff for All-Time Leave Dossier
  const currentLeaveStaff = useMemo(() => {
    if (selectedLeaveStaffId) {
      const found = allStaffList.find(s => s.id === selectedLeaveStaffId);
      if (found) return found;
    }
    if (leaveSearchStaffQuery.trim()) {
      const q = leaveSearchStaffQuery.toLowerCase().trim();
      const match = allStaffList.find(s =>
        s.name.toLowerCase().includes(q) ||
        s.awpoId.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q)
      );
      if (match) return match;
    }
    return allStaffList[0] || null;
  }, [selectedLeaveStaffId, leaveSearchStaffQuery, allStaffList]);

  // Filter staff list for Leave Dossier quick search
  const filteredLeaveStaffList = useMemo(() => {
    if (!leaveSearchStaffQuery.trim()) return allStaffList;
    const q = leaveSearchStaffQuery.toLowerCase().trim();
    return allStaffList.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.awpoId.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q) ||
      s.beatOrSection.toLowerCase().includes(q)
    );
  }, [leaveSearchStaffQuery, allStaffList]);

  // Compute All-Time Leave Dossier for the selected staff
  const staffAllTimeLeaveDossier = useMemo(() => {
    if (!currentLeaveStaff) {
      return {
        rows: [],
        stats: {
          totalLeaves: 0,
          cl: 0,
          rh: 0,
          lap: 0,
          lhap: 0,
          pl: 0,
          med: 0,
          l: 0,
          absent: 0,
          totalRecordedDays: 0,
          firstDate: '',
          lastDate: ''
        }
      };
    }

    const records = attendanceRecords
      .filter(r => r.staffId === currentLeaveStaff.id || (r.staffName && r.staffName.toLowerCase() === currentLeaveStaff.name.toLowerCase()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const stats = {
      totalLeaves: 0,
      cl: 0,
      rh: 0,
      lap: 0,
      lhap: 0,
      pl: 0,
      med: 0,
      l: 0,
      absent: 0,
      totalRecordedDays: records.length,
      firstDate: records.length > 0 ? records[0].date : '',
      lastDate: records.length > 0 ? records[records.length - 1].date : ''
    };

    records.forEach(r => {
      const s = r.status;
      if (s === 'CL') { stats.cl++; stats.totalLeaves++; }
      else if (s === 'RH') { stats.rh++; stats.totalLeaves++; }
      else if (s === 'LAP') { stats.lap++; stats.totalLeaves++; }
      else if (s === 'LHAP') { stats.lhap++; stats.totalLeaves++; }
      else if (s === 'PL') { stats.pl++; stats.totalLeaves++; }
      else if (s === 'MED') { stats.med++; stats.totalLeaves++; }
      else if (s === 'L') { stats.l++; stats.totalLeaves++; }
      else if (s === 'A') { stats.absent++; stats.totalLeaves++; }
    });

    const getLeaveLabel = (st: AttendanceStatus) => {
      switch (st) {
        case 'CL': return 'Casual Leave (CL)';
        case 'RH': return 'Restricted Holiday (RH)';
        case 'LAP': return 'Leave on Average Pay (LAP)';
        case 'LHAP': return 'Leave on Half Average Pay (LHAP)';
        case 'PL': return 'Paternity / Maternity Leave (PL)';
        case 'MED': return 'Medical Leave (MED)';
        case 'L': return 'Outsource Leave (L)';
        case 'A': return 'Absent (A)';
        default: return st;
      }
    };

    const getDefaultReason = (st: AttendanceStatus) => {
      switch (st) {
        case 'CL': return 'Urgent Personal / Domestic Work';
        case 'RH': return 'Religious Festival Celebration';
        case 'LAP': return 'Annual Scheduled Leave';
        case 'LHAP': return 'Medical / Commuted Leave';
        case 'PL': return 'Paternity / Family Support';
        case 'MED': return 'Medical Illness with Medical Fitness Certificate';
        case 'L': return 'Sanctioned Outsource Leave';
        case 'A': return 'Unauthorized Absence from P-Way Beat';
        default: return 'Authorized Leave';
      }
    };

    const formatRangeDate = (dStr: string) => {
      if (!dStr) return '-';
      const clean = dStr.trim();
      if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) return clean;
      const dt = new Date(clean);
      if (isNaN(dt.getTime())) return clean;
      const day = String(dt.getDate()).padStart(2, '0');
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const year = dt.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Group consecutive days of the same leave status
    const leaveEvents: {
      id: string;
      dateRange: string;
      fromDate: string;
      toDate: string;
      daysCount: number;
      leaveType: AttendanceStatus;
      leaveTypeLabel: string;
      reason: string;
    }[] = [];

    interface LeaveBlock {
      fromDate: string;
      toDate: string;
      dates: string[];
      leaveType: AttendanceStatus;
      remarks: string;
    }

    let currentBlock: LeaveBlock | null = null;

    const pushCurrentBlock = (blk: LeaveBlock) => {
      const fromFmt = formatRangeDate(blk.fromDate);
      const toFmt = formatRangeDate(blk.toDate);
      leaveEvents.push({
        id: `${blk.fromDate}_${blk.leaveType}`,
        dateRange: blk.fromDate === blk.toDate ? fromFmt : `${fromFmt} to ${toFmt}`,
        fromDate: blk.fromDate,
        toDate: blk.toDate,
        daysCount: blk.dates.length,
        leaveType: blk.leaveType,
        leaveTypeLabel: getLeaveLabel(blk.leaveType),
        reason: blk.remarks || getDefaultReason(blk.leaveType)
      });
    };

    for (const rec of records) {
      const isLeave = ['LAP', 'LHAP', 'CL', 'RH', 'PL', 'MED', 'L', 'A'].includes(rec.status);
      if (!isLeave) {
        if (currentBlock) {
          pushCurrentBlock(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      if (currentBlock && currentBlock.leaveType === rec.status) {
        const prevDate = new Date(currentBlock.toDate);
        const currDate = new Date(rec.date);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 1) {
          currentBlock.toDate = rec.date;
          currentBlock.dates.push(rec.date);
          if (rec.remarks && !currentBlock.remarks) currentBlock.remarks = rec.remarks;
          continue;
        }
      }

      if (currentBlock) {
        pushCurrentBlock(currentBlock);
      }

      currentBlock = {
        fromDate: rec.date,
        toDate: rec.date,
        dates: [rec.date],
        leaveType: rec.status,
        remarks: rec.remarks || ''
      };
    }

    if (currentBlock) {
      pushCurrentBlock(currentBlock);
    }

    return {
      rows: leaveEvents.reverse(), // latest first
      stats
    };
  }, [currentLeaveStaff, attendanceRecords]);

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
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
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
        "-", "-"
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const catSuffix = selectedMonthlyCategory === "ALL" ? "All_Categories" : selectedMonthlyCategory;
    link.setAttribute("download", `DFCCIL_Attendance_Statement_${catSuffix}_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct High-Resolution A4 Landscape PDF Generator
  const exportMonthlyPdf = () => {
    const monthName = MONTH_NAMES[selectedMonth];
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const categoryLabel = selectedMonthlyCategory === 'ALL'
      ? 'All Categories (Consolidated)'
      : MONTHLY_CATEGORY_GROUPS.find(g => g.key === selectedMonthlyCategory)?.label || selectedMonthlyCategory;

    // Header Title
    doc.setFillColor(18, 59, 114);
    doc.rect(6, 6, 285, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DEDICATED FREIGHT CORRIDOR CORPORATION OF INDIA LTD.', 148.5, 11, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('IMSD SMUN (CIVIL / P-WAY) · SECTION: KM 1167.210 TO KM 1249.720', 148.5, 15, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`CATEGORY-WISE MONTHLY ATTENDANCE STATEMENT — ${monthName.toUpperCase()} ${selectedYear} (${categoryLabel})`, 148.5, 19.5, { align: 'center' });

    // Table Headers
    const headers = [
      '#',
      'Staff Name',
      'Designation',
      'AWPO/ID',
      ...monthDates.map(d => `${d.dayNum}\n${d.dayName[0]}`),
      'P',
      'REST'
    ];

    const body: any[] = [];

    groupedMonthlyData.forEach((group, gIdx) => {
      // Category Group Banner Row
      body.push([
        {
          content: `${gIdx + 1}. ${group.label.toUpperCase()} (${group.subtotals.totalStaff} Personnel)  |  Sub-Total: ${group.subtotals.present} Present, ${group.subtotals.rest} Rest Days`,
          colSpan: headers.length,
          styles: { fillColor: [220, 230, 245], fontStyle: 'bold', textColor: [15, 35, 75], halign: 'left' }
        }
      ]);

      // Staff Rows
      group.rows.forEach((row, rIdx) => {
        body.push([
          rIdx + 1,
          row.staff.name,
          row.staff.designation,
          row.staff.awpoId || '-',
          ...monthDates.map(d => row.dailyMap[d.dayNum] || 'P'),
          row.presentCount,
          row.restCount
        ]);
      });

      // Category Subtotal
      body.push([
        {
          content: `${group.label} Sub-Total:`,
          colSpan: 4,
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 243, 248] }
        },
        ...monthDates.map(() => ({ content: '—', styles: { halign: 'center', fillColor: [240, 243, 248], textColor: [120, 120, 120] } })),
        { content: String(group.subtotals.present), styles: { fontStyle: 'bold', fillColor: [209, 250, 229], textColor: [6, 95, 70] } },
        { content: String(group.subtotals.rest), styles: { fontStyle: 'bold', fillColor: [219, 234, 254], textColor: [30, 64, 175] } }
      ]);
    });

    // Column Sizing
    const columnStyles: any = {
      0: { cellWidth: 6, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 15, halign: 'center' }
    };

    const dateColWidth = daysInMonth === 31 ? 6.0 : daysInMonth === 30 ? 6.2 : 6.5;
    for (let i = 0; i < monthDates.length; i++) {
      const colIdx = 4 + i;
      columnStyles[colIdx] = { cellWidth: dateColWidth, halign: 'center' };
    }

    const pIdx = 4 + monthDates.length;
    const restIdx = pIdx + 1;

    columnStyles[pIdx] = { cellWidth: 9, halign: 'center', fontStyle: 'bold' };
    columnStyles[restIdx] = { cellWidth: 9, halign: 'center', fontStyle: 'bold' };

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 24,
      margin: { top: 24, left: 6, right: 6, bottom: 20 },
      theme: 'grid',
      styles: {
        fontSize: 5.5,
        cellPadding: 0.8,
        lineColor: [180, 190, 205],
        lineWidth: 0.2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [18, 59, 114],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 5.5,
        halign: 'center'
      },
      didDrawPage: () => {
        const pageHeight = doc.internal.pageSize.height || 210;
        doc.setFontSize(6.5);
        doc.setTextColor(50, 50, 50);

        // Left signature
        doc.text('____________________________________', 25, pageHeight - 12);
        doc.setFont('helvetica', 'bold');
        doc.text('Arjun Kumar', 25, pageHeight - 8);
        doc.setFont('helvetica', 'normal');
        doc.text('Executive / Civil / SMUN (DFCCIL P-Way Unit)', 25, pageHeight - 5);

        // Right signature
        doc.text('____________________________________', 225, pageHeight - 12);
        doc.setFont('helvetica', 'bold');
        doc.text('Vivek Kumar Azad', 225, pageHeight - 8);
        doc.setFont('helvetica', 'normal');
        doc.text('APM / Civil / SMUN (DFCCIL Unit Incharge)', 225, pageHeight - 5);

        // Footer Page Number
        doc.setFontSize(6);
        doc.setTextColor(120, 120, 120);
        doc.text(`Page ${doc.getNumberOfPages()} · Generated on: ${new Date().toLocaleDateString('en-GB')}`, 148.5, pageHeight - 4, { align: 'center' });
      }
    });

    const catSuffix = selectedMonthlyCategory === 'ALL' ? 'All_Categories' : selectedMonthlyCategory;
    doc.save(`DFCCIL_Attendance_Statement_${catSuffix}_${monthName}_${selectedYear}.pdf`);
  };

  const handlePrintSheet = () => {
    const printElem = document.getElementById('printable-monthly-statement');
    if (!printElem) {
      window.print();
      return;
    }
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DFCCIL Attendance Statement - ${MONTH_NAMES[selectedMonth]} ${selectedYear}</title>
          <style>
            @page { size: A4 landscape; margin: 4mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 4mm; color: #000; }
            table { width: 100%; border-collapse: collapse; font-size: 8pt; line-height: 1.15; }
            th, td { border: 0.8px solid #334155; padding: 2px 2px; text-align: center; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .bg-slate-200 { background-color: #e2e8f0; }
            .bg-slate-100 { background-color: #f1f5f9; }
            .bg-emerald-50 { background-color: #ecfdf5; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-purple-100 { background-color: #f3e8ff; }
            .bg-blue-100 { background-color: #dbeafe; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-black { font-weight: 900; }
            .print-signatures-block { display: flex; justify-content: space-between; margin-top: 25px; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${printElem.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadgeStyle = (st: AttendanceStatus | '-') => {
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
      case '-':
        return 'text-slate-300 dark:text-slate-600 font-normal';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 print-container">
      {/* Top Brand Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Staff Daily Attendance &amp; Absentee ERP</h2>
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
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Day status badge */}
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  currentDateInfo.isNH
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                    : currentDateInfo.isSunday
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                }`}>
                  {currentDateInfo.isNH ? '🎉 ' : currentDateInfo.isSunday ? '☕ ' : '🟢 '}
                  <span>{currentDateInfo.title}</span>
                </span>
              </div>

              {/* Day Declaration Admin Controls */}
              {!isGuest && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">Declare Day:</span>
                  <button
                    type="button"
                    onClick={() => handleDeclareDayType('NORMAL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      !currentDateInfo.isHoliday
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700'
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
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700'
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
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    🎉 National Holiday (NH)
                  </button>
                </div>
              )}
            </div>

            {/* 👁️ Guest Mode Banner */}
            {isGuest && (
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-2 border-blue-300 dark:border-blue-700 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 font-bold">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <span>👁️ Guest Visitor Mode: You are viewing attendance in read-only mode. Attendance marking, holiday declarations, and leave approvals are strictly restricted to authorized staff.</span>
                </div>
                <span className="px-2.5 py-1 bg-blue-200 dark:bg-blue-900 text-blue-950 dark:text-blue-100 font-black rounded-lg font-mono text-[10px] whitespace-nowrap shadow-sm">
                  GUEST (READ-ONLY)
                </span>
              </div>
            )}
            
            {/* 🔒 4-Day Historical Lock Alert Banner */}
            {!isGuest && isDateLockedForNonAdmin && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 font-bold">
                  <Lock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>🔒 Attendance Record Locked: {selectedDate} ki attendance 4 din se purani hai. Policy ke anusar purane records me badlav restricted hai. Yeh record kewal APM / Civil (Shri Vivek Kumar Azad, Super Admin ID) ke login se hi unlock aur edit kiya ja sakta hai.</span>
                </div>
                <span className="px-2.5 py-1 bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-black rounded-lg font-mono text-[10px] whitespace-nowrap shadow-sm">
                  🔒 LOCKED (&gt; 4 DAYS)
                </span>
              </div>
            )}

            {!isGuest && isSuperAdmin && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-2 text-xs shadow-sm">
                <div className="flex items-center gap-2 font-bold">
                  <Unlock className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>🔓 Super Admin Override Active: Logged in as APM / Civil (Shri Vivek Kumar Azad). All past attendance dates (&gt; 4 days) are fully unlocked for administrative editing.</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 font-black rounded-md font-mono text-[9px] whitespace-nowrap">
                  APM UNLOCKED
                </span>
              </div>
            )}

            {/* Attendance Metrics Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Total Staff</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{dailyMetrics.total}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">Present (P)</span>
                <span className="text-xl font-black text-emerald-900 dark:text-emerald-300 font-mono">{dailyMetrics.p}</span>
              </div>
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3 rounded-xl">
                <span className="text-[10px] text-red-700 dark:text-red-400 font-bold block uppercase">Absent (A)</span>
                <span className="text-xl font-black text-red-900 dark:text-red-300 font-mono">{dailyMetrics.a}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block uppercase">Leaves (LAP/CL/L)</span>
                <span className="text-xl font-black text-amber-900 dark:text-amber-300 font-mono">{dailyMetrics.l}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-3 rounded-xl">
                <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold block uppercase">Rest / Sunday</span>
                <span className="text-xl font-black text-blue-900 dark:text-blue-300 font-mono">{dailyMetrics.rest}</span>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 p-3 rounded-xl">
                <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold block uppercase">Holiday (NH)</span>
                <span className="text-xl font-black text-purple-900 dark:text-purple-300 font-mono">{dailyMetrics.nh}</span>
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 p-3 rounded-xl">
                <span className="text-[10px] text-violet-700 dark:text-violet-400 font-bold block uppercase">Duty / Tour (OD)</span>
                <span className="text-xl font-black text-violet-900 dark:text-violet-300 font-mono">{dailyMetrics.od}</span>
              </div>
            </div>

            {/* Quick Bulk Marking Actions */}
            {!isGuest && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">Quick Bulk Mark:</span>
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
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Name, ID, or Section..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="PERMANENT">Permanent Staff</option>
                <option value="OUTSOURCE">Outsource MTS</option>
                <option value="KEYMAN">Keyman</option>
                <option value="PATROL_DAY">Day Patrolman (दिन की पेट्रोलिंग)</option>
                <option value="PATROL_NIGHT">Night Patrolman (रात की पेट्रोलिंग)</option>
                <option value="GATEMAN">Gateman</option>
                <option value="WATCHMAN">Watchman</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full max-w-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 min-w-[240px]">Staff Member (Name, ID, Designation)</th>
                    <th className="p-3 min-w-[320px]">Mark Status</th>
                    <th className="p-3 min-w-[140px]">Remarks</th>
                    <th className="p-3 text-right min-w-[120px]">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredDailyStaff.map((staff, idx) => {
                    const { status, remarks } = getStaffStatus(staff);
                    const cleanPhone = (staff.phone || '').replace(/[^0-9]/g, '');
                    const statusOptions = staff.isPermanent ? PERMANENT_STATUS_OPTIONS : OUTSOURCE_STATUS_OPTIONS;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3 text-slate-400 dark:text-slate-500 font-mono text-center">{idx + 1}</td>
                        
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
                              className="font-black text-sm text-slate-900 dark:text-white hover:text-blue-700 dark:hover:text-cyan-400 hover:underline text-left inline-flex items-center gap-1.5"
                            >
                              <span>{staff.name}</span>
                            </button>
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-mono text-[10px] bg-blue-50 dark:bg-blue-950/60 text-[#0f2b5c] dark:text-cyan-300 font-black px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                {staff.awpoId}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400 font-bold text-xs">
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
                                  disabled={isGuest || isDateLockedForNonAdmin}
                                  onClick={() => handleMarkStaffStatus(staff, opt.status)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition border ${
                                    isSelected
                                      ? opt.activeClass
                                      : `${opt.colorClass} border-transparent`
                                  } ${isGuest || isDateLockedForNonAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                                  title={isGuest ? 'Guest mode: Read-only' : opt.label}
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
                            disabled={isGuest || isDateLockedForNonAdmin}
                            onBlur={e => handleMarkStaffStatus(staff, status, e.target.value)}
                            placeholder={isGuest ? '-' : 'Remarks...'}
                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 w-full focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 disabled:opacity-60"
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
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900"
                            >
                              🪪 ID
                            </button>
                            {staff.phone && staff.phone !== '-' && (
                              <>
                                <a
                                  href={`tel:${staff.phone}`}
                                  className="p-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                  title="Call Staff"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Statement Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {[2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  {daysInMonth} Calendar Days · {monthDates.filter(d => d.isSunday).length} Sundays · {monthDates.filter(d => d.isNH).length} Gazetted NH
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveReportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Open Detailed Staff Leave Register (CL, RH, LAP, LHAP, PL, MED)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Leave Statement (छुट्टी रजिस्टर)</span>
                </button>

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
                  onClick={exportMonthlyPdf}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Direct Download complete 31-Day Attendance Statement to PDF in Landscape mode"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export PDF (पूरे महीने का PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSheet}
                  className="px-3.5 py-1.5 bg-[#123b72] hover:bg-[#1a4f9c] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Print Attendance Sheet in Landscape A4"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
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
                        : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      selectedMonthlyCategory === cat.key ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Total Staff</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.totalStaff, 0)} Personnel
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">Total Present (P)</span>
              <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.present, 0)} Days
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 p-3 rounded-xl shadow-sm">
              <span className="text-[10px] text-blue-700 dark:text-blue-400 font-bold block uppercase">Rest / Off (REST)</span>
              <span className="text-lg font-black text-blue-800 dark:text-blue-300 font-mono">
                {groupedMonthlyData.reduce((acc, g) => acc + g.subtotals.rest, 0)} Days
              </span>
            </div>
          </div>

          {/* Print Style Isolation for Monthly Absentee Statement */}
          <style>{`
            @page {
              size: A4 landscape;
              margin: 4mm 4mm 4mm 4mm;
            }
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-monthly-statement, #printable-monthly-statement * {
                visibility: visible !important;
              }
              #printable-monthly-statement {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 2mm 2mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
                z-index: 999999 !important;
              }
              #printable-monthly-statement table {
                font-size: 7pt !important;
                line-height: 1.15 !important;
                width: 100% !important;
                border-collapse: collapse !important;
              }
              #printable-monthly-statement th, #printable-monthly-statement td {
                padding: 1.5px 1px !important;
                border: 0.6px solid #475569 !important;
              }
              #printable-monthly-statement thead {
                display: table-header-group !important;
              }
              #printable-monthly-statement tr {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
              }
              .print-signatures-block {
                page-break-inside: avoid !important;
                margin-top: 15px !important;
              }
            }
          `}</style>

          {/* Official Printable Statement */}
          <div id="printable-monthly-statement" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="text-center border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-[#123b72] text-white text-[10px] font-bold rounded">DFCCIL IMSD SMUN</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">CIVIL / P-WAY</span>
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                CATEGORY-WISE MONTHLY ATTENDANCE STATEMENT
              </h3>
              <p className="text-xs text-slate-600 font-mono">
                Month: {MONTH_NAMES[selectedMonth]} {selectedYear} · Section: Km 1167.210 – 1249.720 · Category: {selectedMonthlyCategory === "ALL" ? "All Categories (Consolidated)" : MONTHLY_CATEGORY_GROUPS.find(g => g.key === selectedMonthlyCategory)?.label}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] text-slate-800 border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="p-1.5 border border-slate-300 w-7 text-center">#</th>
                    <th className="p-1.5 border border-slate-300 min-w-[130px]">Staff Name</th>
                    <th className="p-1.5 border border-slate-300 min-w-[100px]">Designation</th>
                    <th className="p-1.5 border border-slate-300 min-w-[70px]">AWPO / ID</th>
                    {monthDates.map(d => (
                      <th
                        key={d.dayNum}
                        className={`p-0.5 border border-slate-300 text-center font-mono text-[10px] w-6 ${
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
                    <th className="p-1.5 border border-slate-300 text-center bg-emerald-50 text-emerald-900 font-bold w-9">P</th>
                    <th className="p-1.5 border border-slate-300 text-center bg-blue-50 text-blue-900 font-bold w-9">REST</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedMonthlyData.map((group, gIdx) => (
                    <React.Fragment key={group.key}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-200/90 text-slate-900 font-black border-y-2 border-slate-400">
                        <td colSpan={monthDates.length + 6} className="p-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs uppercase tracking-wide">
                              <span>{group.icon}</span>
                              <span>{gIdx + 1}. {group.label}</span>
                              <span className="px-2 py-0.5 bg-[#123b72] text-white rounded text-[10px] font-mono">
                                {group.subtotals.totalStaff} Personnel
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-600">
                              Sub-Total: {group.subtotals.present} Present · {group.subtotals.rest} Rest Days
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Staff Rows in this Category */}
                      {group.rows.map((row, rIdx) => (
                        <tr key={row.staff.id} className="hover:bg-slate-50 transition font-sans">
                          <td className="p-1 border border-slate-300 text-slate-500 font-mono text-center text-xs">{rIdx + 1}</td>
                          <td className="p-1 border border-slate-300 font-bold text-slate-900 whitespace-nowrap">{row.staff.name}</td>
                          <td className="p-1 border border-slate-300 text-slate-700 whitespace-nowrap text-xs">{row.staff.designation}</td>
                          <td className="p-1 border border-slate-300 font-mono text-slate-600 text-xs">{row.staff.awpoId}</td>
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
                          <td className="p-1 border border-slate-300 text-center font-bold text-emerald-800 bg-emerald-50/50 font-mono">{row.presentCount}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono text-blue-800 font-bold">{row.restCount}</td>
                        </tr>
                      ))}

                      {/* Category Subtotal Row */}
                      <tr className="bg-slate-100 font-bold border-b-2 border-slate-300 text-slate-900">
                        <td colSpan={4} className="p-1.5 border border-slate-300 text-right pr-3 text-xs">
                          {group.label} Sub-Total:
                        </td>
                        <td colSpan={monthDates.length} className="p-1.5 border border-slate-300 text-center text-slate-400 font-mono">
                          —
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center text-emerald-800 font-mono font-black">{group.subtotals.present}</td>
                        <td className="p-1.5 border border-slate-300 text-center text-blue-800 font-mono font-black">{group.subtotals.rest}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✍️ Official Dual Signature Stamps Block for DFCCIL Record */}
            <div className="mt-10 pt-6 border-t-2 border-slate-300 dark:border-slate-700 flex items-end justify-between px-8 pb-4 print-signatures-block">
              <div className="text-center">
                <div className="w-56 border-b-2 border-slate-800 dark:border-slate-300 mb-2 h-16 flex items-end justify-center">
                  <span className="text-[10px] italic text-slate-400 font-serif">Verified &amp; Submitted</span>
                </div>
                <div className="font-black text-sm text-slate-900 dark:text-white tracking-wide">Arjun Kumar</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Executive / Civil / SMUN</div>
                <div className="text-[11px] font-semibold text-slate-500">DFCCIL (P-Way Unit)</div>
              </div>

              <div className="text-center">
                <div className="w-56 border-b-2 border-slate-800 dark:border-slate-300 mb-2 h-16 flex items-end justify-center">
                  <span className="text-[10px] italic text-slate-400 font-serif">Countersigned &amp; Approved</span>
                </div>
                <div className="font-black text-sm text-slate-900 dark:text-white tracking-wide">Vivek Kumar Azad</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">APM / Civil / SMUN</div>
                <div className="text-[11px] font-semibold text-slate-500">DFCCIL (Unit Incharge)</div>
              </div>
            </div>
          </div>
        </div>
      )}


{/* ---------------------------------------------------------------------
          TAB 3: HOLIDAY MASTER
      ---------------------------------------------------------------------- */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">NH &amp; Rest Day Calendar Master</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage official Gazetted holidays and special rest days.</p>
            </div>

            {!isGuest && (
              <button
                type="button"
                onClick={() => setIsAddHolidayModalOpen(true)}
                className="px-4 py-2 bg-[#123b72] hover:bg-[#1a4f9c] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Declare New Holiday</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Gazetted 2026 Holidays */}
            {Object.entries(DEFAULT_HOLIDAYS_2026).map(([date, title]) => (
              <div key={date} className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 p-4 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded font-mono font-bold text-xs">
                    {date}
                  </span>
                  <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                    Gazetted 2026
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Indian Railways / DFCCIL Master Calendar</p>
              </div>
            ))}

            {/* Custom Declared Holidays */}
            {holidayRecords.map(h => (
              <div key={h.id} className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/60 p-4 rounded-2xl shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded font-mono font-bold text-xs">
                      {h.date}
                    </span>
                    <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                      Custom Declaration ({h.type})
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">{h.title}</h4>
                  {h.remarks && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{h.remarks}</p>}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">By: {h.declaredBy || 'Admin'}</span>
                  {!isGuest && (
                    <button
                      type="button"
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="p-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded-lg transition"
                      title="Delete Holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isAddHolidayModalOpen && !isGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Declare National Holiday / Rest Day</h3>
              <button onClick={() => setIsAddHolidayModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleSaveHolidayForm} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={holidayFormData.date}
                  onChange={e => setHolidayFormData({ ...holidayFormData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Holiday Title / Occasion</label>
                <input
                  type="text"
                  required
                  value={holidayFormData.title}
                  onChange={e => setHolidayFormData({ ...holidayFormData, title: e.target.value })}
                  placeholder="e.g. Haryana Day, Special Mega Block Rest"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Holiday Category</label>
                <select
                  value={holidayFormData.type}
                  onChange={e => setHolidayFormData({ ...holidayFormData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="NH">National Holiday (NH)</option>
                  <option value="REST">Rest Day</option>
                  <option value="SUNDAY">Sunday Rest</option>
                  <option value="SPECIAL">Special Observance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Remarks / Reference Circular</label>
                <input
                  type="text"
                  value={holidayFormData.remarks}
                  onChange={e => setHolidayFormData({ ...holidayFormData, remarks: e.target.value })}
                  placeholder="Optional reference"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
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

      {/* ------------------------------------------------------------------------- */}
      {/* 4. ALL-TIME INDIVIDUAL STAFF LEAVE DOSSIER MODAL (छुट्टी रजिस्टर) */}
      {/* ------------------------------------------------------------------------- */}
      {isLeaveReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fadeIn">
          {/* Print Style Isolation for Leave Dossier */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-staff-leave-card, #printable-staff-leave-card * {
                visibility: visible !important;
              }
              #printable-staff-leave-card {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
                z-index: 999999 !important;
              }
            }
          `}</style>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <span>Staff Individual Leave Register &amp; Dossier</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-amber-900 uppercase">
                      All-Time History
                    </span>
                  </h3>
                  <p className="text-xs text-amber-100 font-medium">
                    DFCCIL IMSD SMUN · Track Complete Leave Record since First Attendance Entry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95"
                  title="Print this Staff's Official Leave Dossier Card"
                >
                  <Printer className="w-4 h-4 text-amber-900" />
                  <span>Print Leave Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLeaveReportModalOpen(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Header: Staff Quick Search & Selector */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={leaveSearchStaffQuery}
                    onChange={e => setLeaveSearchStaffQuery(e.target.value)}
                    placeholder="Search by Staff Name, AWPO ID, Designation, or Section..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 shadow-sm"
                  />
                  {leaveSearchStaffQuery && (
                    <button
                      type="button"
                      onClick={() => setLeaveSearchStaffQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Staff Dropdown Switcher */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    Selected Staff:
                  </span>
                  <select
                    value={currentLeaveStaff?.id || ''}
                    onChange={e => setSelectedLeaveStaffId(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 shadow-sm max-w-[280px]"
                  >
                    {allStaffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} • {s.designation} ({s.awpoId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Staff Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Quick Select:</span>
                {filteredLeaveStaffList.slice(0, 15).map(s => {
                  const isSelected = currentLeaveStaff?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedLeaveStaffId(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                        isSelected ? 'bg-amber-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {s.awpoId}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body: Printable Individual Staff Leave Card */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-slate-50/50 dark:bg-slate-950/40">
              {currentLeaveStaff ? (
                <div
                  id="printable-staff-leave-card"
                  className="bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-900/50 rounded-3xl p-6 shadow-md space-y-5"
                >
                  {/* Card Header & Staff Profile */}
                  <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Staff Bio */}
                      <div className="flex items-start gap-4">
                        {currentLeaveStaff.photoUrl ? (
                          <img
                            src={currentLeaveStaff.photoUrl}
                            alt={currentLeaveStaff.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center text-xl font-black shadow-sm">
                            {currentLeaveStaff.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                              {currentLeaveStaff.name}
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-[#123b72] border border-blue-200">
                              {currentLeaveStaff.isPermanent ? 'Permanent Staff' : 'Outsource Staff'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {currentLeaveStaff.categoryLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="text-slate-400 block text-[10px]">AWPO / EMP ID:</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{currentLeaveStaff.awpoId}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">DESIGNATION / POST:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{currentLeaveStaff.designation}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">BEAT / SECTION:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{currentLeaveStaff.beatOrSection}</span>
                            </div>
                            {currentLeaveStaff.phone && currentLeaveStaff.phone !== '-' && (
                              <div>
                                <span className="text-slate-400 block text-[10px]">CONTACT NO:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{currentLeaveStaff.phone}</span>
                              </div>
                            )}
                            {currentLeaveStaff.fatherName && (
                              <div>
                                <span className="text-slate-400 block text-[10px]">FATHER'S NAME:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{currentLeaveStaff.fatherName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Unit Stamp */}
                      <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-4">
                        <div className="text-[10px] font-black uppercase text-[#123b72] dark:text-cyan-400">
                          DFCCIL IMSD SMUN
                        </div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Civil Engineering / P-Way
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Records Span: {staffAllTimeLeaveDossier.stats.totalRecordedDays} Days Tracked
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary KPI Cards for this Staff */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl">
                      <span className="text-[10px] text-amber-800 dark:text-amber-400 font-bold block uppercase">
                        Total Leaves Taken (All Time)
                      </span>
                      <span className="text-2xl font-black text-amber-900 dark:text-amber-300 font-mono">
                        {staffAllTimeLeaveDossier.stats.totalLeaves} <span className="text-xs font-normal">Days</span>
                      </span>
                    </div>

                    <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3.5 rounded-2xl">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold block uppercase">
                        Casual &amp; Restricted (CL / RH)
                      </span>
                      <span className="text-2xl font-black text-emerald-900 dark:text-emerald-300 font-mono">
                        {staffAllTimeLeaveDossier.stats.cl + staffAllTimeLeaveDossier.stats.rh} <span className="text-xs font-normal">Days</span>
                      </span>
                    </div>

                    <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 p-3.5 rounded-2xl">
                      <span className="text-[10px] text-blue-800 dark:text-blue-400 font-bold block uppercase">
                        Earned &amp; Medical (LAP / MED)
                      </span>
                      <span className="text-2xl font-black text-blue-900 dark:text-blue-300 font-mono">
                        {staffAllTimeLeaveDossier.stats.lap + staffAllTimeLeaveDossier.stats.lhap + staffAllTimeLeaveDossier.stats.med} <span className="text-xs font-normal">Days</span>
                      </span>
                    </div>

                    <div className="bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3.5 rounded-2xl">
                      <span className="text-[10px] text-red-800 dark:text-red-400 font-bold block uppercase">
                        Unauthorized Absent (A)
                      </span>
                      <span className="text-2xl font-black text-red-900 dark:text-red-300 font-mono">
                        {staffAllTimeLeaveDossier.stats.absent} <span className="text-xs font-normal">Days</span>
                      </span>
                    </div>
                  </div>

                  {/* All-Time Individual Leave Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                        All-Time Leave History Log (सभी दर्ज छुट्टियां)
                      </h5>
                      <span className="text-[11px] font-mono text-slate-500">
                        Total {staffAllTimeLeaveDossier.rows.length} Leave Events Recorded
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-700 text-center">
                            <th className="p-3 w-10">#</th>
                            <th className="p-3 min-w-[180px] text-left">Date (From – To) (अवकाश अवधि)</th>
                            <th className="p-3 min-w-[120px]">No of Days Leave Taken</th>
                            <th className="p-3 min-w-[180px]">Type of Leave</th>
                            <th className="p-3 min-w-[240px] text-left">Reason / Remarks (कारण / विवरण)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                          {staffAllTimeLeaveDossier.rows.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                                <div className="space-y-1.5">
                                  <div className="text-2xl">🟢</div>
                                  <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                    NIL LEAVE RECORDED — FULL ATTENDANCE!
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Yeh staff jab se roll call par darj h, tab se ab tak 100% Present / On Duty rahe hain.
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            staffAllTimeLeaveDossier.rows.map((event, idx) => {
                              const isAbsent = event.leaveType === 'A';
                              return (
                                <tr
                                  key={event.id}
                                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition text-center ${
                                    isAbsent ? 'bg-red-50/30' : ''
                                  }`}
                                >
                                  <td className="p-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                                  <td className="p-3 text-left font-mono font-bold text-slate-900 dark:text-white">
                                    {event.dateRange}
                                  </td>
                                  <td className="p-3 font-mono font-black text-amber-800 dark:text-amber-300">
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 inline-block">
                                      {event.daysCount} {event.daysCount === 1 ? 'Day' : 'Days'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block ${
                                      isAbsent
                                        ? 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 border border-red-300'
                                        : 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'
                                    }`}>
                                      {event.leaveTypeLabel}
                                    </span>
                                  </td>
                                  <td className="p-3 text-left text-xs text-slate-700 dark:text-slate-300 font-medium">
                                    {event.reason}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom Verification & Signature Block */}
                  <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div>
                      <span>Generated on: {new Date().toLocaleDateString('en-GB')} · DFCCIL ERP System</span>
                    </div>
                    <div className="text-right font-mono text-[10px]">
                      Authentic Leave Dossier • IMSD SMUN
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  Select a staff member from the search bar above to view their all-time leave card.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <span className="text-xs text-slate-500 font-medium">
                {allStaffList.length} Total Staff in SMUN Roster · Staff-wise All-Time Attendance History
              </span>
              <button
                type="button"
                onClick={() => setIsLeaveReportModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
              >
                Close Register
              </button>
            </div>
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
