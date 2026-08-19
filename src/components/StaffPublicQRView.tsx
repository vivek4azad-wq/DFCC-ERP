/**
 * DFCCIL Dynamic Staff Public QR Verification View
 * Opened instantly when a mobile phone scans a Staff ID QR Code
 * Displays:
 * - Real-time Live Attendance Status (Today)
 * - Official DFCCIL IMSD SMUN Identity & Photo
 * - Designation, AWPO/Employee ID, Father's Name
 * - Assigned Beat / Section / Level Crossing / Bridge Jurisdiction
 * - Verified Official Credentials & Contact
 */

import React, { useState, useEffect } from 'react';
import { db } from '../services/database.ts';
import {
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import type { OfficerStaffRecord, KeymanRecord, PatrolShiftRecord, LevelCrossingRecord, BridgeWatchmanRecord, DailyAttendanceRecord } from '../types/index.ts';

interface StaffPublicQRViewProps {
  staffId: string;
  onBackToApp?: () => void;
}

export const StaffPublicQRView: React.FC<StaffPublicQRViewProps> = ({
  staffId,
  onBackToApp
}) => {
  const [staffData, setStaffData] = useState<any | null>(null);
  const [attendanceToday, setAttendanceToday] = useState<{ status: string; statusLabel: string; color: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStaffData = async () => {
    try {
      setIsLoading(true);
      const [officers, keymen, patrols, lcs, watchmen, attendances] = await Promise.all([
        db.getCollection<OfficerStaffRecord>('officers_staff'),
        db.getCollection<KeymanRecord>('keymen'),
        db.getCollection<PatrolShiftRecord>('patrol_shifts'),
        db.getCollection<LevelCrossingRecord>('level_crossings'),
        db.getCollection<BridgeWatchmanRecord>('bridge_watchmen'),
        db.getCollection<DailyAttendanceRecord>('staff_attendance')
      ]);

      const cleanId = String(staffId || '').trim().toLowerCase();
      let found: any = null;

      // 1. Check officers_staff
      const off = officers.find(o => 
        (o.id && o.id.toLowerCase() === cleanId) ||
        (o.awpoId && o.awpoId.toLowerCase() === cleanId) ||
        (o.employeeId && o.employeeId.toLowerCase() === cleanId) ||
        (o.name && o.name.toLowerCase().includes(cleanId))
      );
      if (off) {
        found = {
          ...off,
          displayId: off.employeeId || off.awpoId || off.id,
          displayDesignation: off.post || 'Executive / Staff',
          displaySection: off.assignedSection || off.headquarters || 'IMSD SMUN',
          displayPhone: off.phone || '-',
          displayCategory: off.staffCategory === 'PERMANENT' ? 'Permanent Staff' : 'Outsource Staff (MTS)'
        };
      }

      // 2. Check keymen
      if (!found) {
        const km = keymen.find(k =>
          (k.id && k.id.toLowerCase() === cleanId) ||
          (k.awpoId && k.awpoId.toLowerCase() === cleanId) ||
          (k.staffId && k.staffId.toLowerCase() === cleanId) ||
          (k.name && k.name.toLowerCase().includes(cleanId))
        );
        if (km) {
          found = {
            ...km,
            displayId: km.awpoId || km.id,
            displayDesignation: `Keyman (${km.beatNoText || 'Beat'})`,
            displaySection: `${km.beatNoText || 'Keyman Beat'} (${km.kmRange || `Km ${km.fromKm.toFixed(3)}-${km.toKm.toFixed(3)}`})`,
            displayPhone: km.mobileNo || km.otherMobileNo || '-',
            displayCategory: 'Keyman (Ex-Serviceman)'
          };
        }
      }

      // 3. Check patrols
      if (!found) {
        const pat = patrols.find(p =>
          (p.id && p.id.toLowerCase() === cleanId) ||
          (p.patrolmanStaffId && p.patrolmanStaffId.toLowerCase() === cleanId) ||
          (p.beatCode && p.beatCode.toLowerCase() === cleanId) ||
          (p.patrolmanName && p.patrolmanName.toLowerCase().includes(cleanId))
        );
        if (pat) {
          found = {
            ...pat,
            name: pat.patrolmanName,
            displayId: pat.patrolmanStaffId || pat.beatCode,
            displayDesignation: `${pat.shiftType === 'DAY' ? 'Day' : 'Night'} Patrolman (${pat.beatCode})`,
            displaySection: `${pat.beatCode} (${pat.route || `Km ${pat.fromKm.toFixed(3)}-${pat.toKm.toFixed(3)}`})`,
            displayPhone: pat.patrolmanPhone || '-',
            displayCategory: 'Patrolman (Security)'
          };
        }
      }

      // 4. Check gatemen
      if (!found) {
        for (const lc of lcs) {
          if (Array.isArray(lc.gatemen)) {
            const gm = lc.gatemen.find((g: any) =>
              (g.id && String(g.id).toLowerCase() === cleanId) ||
              (g.name && g.name.toLowerCase().includes(cleanId))
            );
            if (gm) {
              found = {
                ...gm,
                displayId: gm.id || '-',
                displayDesignation: `Gateman (LC ${lc.gateNo || lc.lc_no})`,
                displaySection: `LC Gate ${lc.gateNo || lc.lc_no} (Km ${Number(lc.km || lc.chainage || 0).toFixed(3)})`,
                displayPhone: gm.mobile || '-',
                displayCategory: 'Level Crossing Gateman'
              };
              break;
            }
          }
        }
      }

      // 5. Check watchmen
      if (!found) {
        const wm = watchmen.find(w =>
          (w.id && w.id.toLowerCase() === cleanId) ||
          (w.staffId && w.staffId.toLowerCase() === cleanId) ||
          (w.awpoId && w.awpoId.toLowerCase() === cleanId) ||
          (w.name && w.name.toLowerCase().includes(cleanId))
        );
        if (wm) {
          found = {
            ...wm,
            displayId: wm.awpoId || wm.staffId || wm.id,
            displayDesignation: wm.post || 'Bridge Watchman',
            displaySection: `Bridge ${wm.bridgeNo || '108'} (ROR Rajpura Detour)`,
            displayPhone: wm.phone || '-',
            displayCategory: 'Bridge Watchman'
          };
        }
      }

      if (found) {
        setStaffData(found);

        // Fetch Live Attendance Status for Today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = attendances.find(a => 
          a.date === todayStr && 
          (a.staffId === found.id || (found.displayId && a.staffId === found.displayId) || a.staffName === found.name)
        );

        if (todayRecord) {
          const st = todayRecord.status;
          if (st === 'P') {
            setAttendanceToday({ status: 'PRESENT (P)', statusLabel: 'On Duty Today', color: 'bg-emerald-500 text-white' });
          } else if (st === 'A') {
            setAttendanceToday({ status: 'ABSENT (A)', statusLabel: 'Absent Today', color: 'bg-red-500 text-white' });
          } else if (st === 'REST' || st === 'WO') {
            setAttendanceToday({ status: 'REST (WO)', statusLabel: 'Weekly Rest', color: 'bg-blue-500 text-white' });
          } else if (st === 'NH') {
            setAttendanceToday({ status: 'HOLIDAY (NH)', statusLabel: 'National Holiday', color: 'bg-purple-500 text-white' });
          } else {
            setAttendanceToday({ status: st, statusLabel: `Leave (${st})`, color: 'bg-amber-500 text-white' });
          }
        } else {
          setAttendanceToday({ status: 'ACTIVE', statusLabel: 'On Roster (Active Duty)', color: 'bg-emerald-600 text-white' });
        }
      }
    } catch (err) {
      console.error('Failed to load dynamic staff QR data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
    const unsub = db.subscribe(() => {
      loadStaffData();
    });
    return () => unsub();
  }, [staffId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-blue-200">Verifying Official DFCCIL Credentials...</p>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-2xl max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-red-200">Staff Record Not Found</h2>
          <p className="text-xs text-red-300/80 mt-1">
            No official record found matching ID: <span className="font-mono font-bold text-white">{staffId}</span>
          </p>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Open Rail Diary ERP
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col items-center p-4 sm:p-6 antialiased">
      {/* Top Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between py-2 mb-3 border-b border-blue-900/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 p-0.5">
            <img src="/logo.png" alt="DFCCIL Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-xs font-black text-white tracking-wide">DFCCIL IMSD SMUN</div>
            <div className="text-[10px] text-blue-300 font-semibold">Official Staff Verification</div>
          </div>
        </div>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/60 px-2.5 py-1.5 rounded-lg border border-blue-800/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open ERP</span>
          </button>
        )}
      </div>

      {/* Main Official Verification Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-blue-500/30 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Verification Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0f2b5c] p-4 text-center border-b border-blue-500/20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-black mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>VERIFIED OFFICIAL CREDENTIALS</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">{staffData.name}</h1>
          {staffData.nameHi && <p className="text-xs text-blue-200 mt-0.5">{staffData.nameHi}</p>}
          <p className="text-xs font-bold text-blue-300 mt-1">{staffData.displayDesignation}</p>
        </div>

        {/* Live Attendance Badge */}
        {attendanceToday && (
          <div className="px-5 pt-4 pb-2">
            <div className={`p-3 rounded-2xl flex items-center justify-between ${attendanceToday.color} shadow-lg`}>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 opacity-90" />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Today's Live Status</div>
                  <div className="text-sm font-black">{attendanceToday.statusLabel}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-xl text-xs font-black">
                {attendanceToday.status}
              </span>
            </div>
          </div>
        )}

        {/* Profile & Photo Section */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-28 rounded-2xl overflow-hidden border-2 border-blue-500/40 bg-slate-800 flex-shrink-0 shadow-md">
              {staffData.photoUrl ? (
                <img src={staffData.photoUrl} alt={staffData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <User className="w-10 h-10 mb-1 opacity-50" />
                  <span className="text-[9px] font-bold">NO PHOTO</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">AWPO / Staff ID:</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{staffData.displayId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Category:</span>
                <span className="font-bold text-white">{staffData.displayCategory}</span>
              </div>
              {staffData.fatherName && (
                <div>
                  <span className="text-slate-400 text-[10px] block">Father's Name:</span>
                  <span className="font-semibold text-slate-200">{staffData.fatherName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold">Assigned Beat / Section</div>
                <div className="font-semibold text-slate-100">{staffData.displaySection}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 border-t border-slate-800/80 pt-2">
              <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold">Primary Mobile</div>
                <div className="font-mono font-bold text-emerald-300">{staffData.displayPhone}</div>
              </div>
            </div>

            {staffData.residence && (
              <div className="flex items-start gap-2.5 border-t border-slate-800/80 pt-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">Residence / Gate Lodge</div>
                  <div className="font-medium text-slate-300">{staffData.residence}</div>
                </div>
              </div>
            )}
          </div>

          {/* Official Verification Footer */}
          <div className="text-center pt-2">
            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Live Telemetry Synchronized: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="text-[9px] text-slate-600 mt-1">
              Dedicated Freight Corridor Corporation of India Limited (Ministry of Railways)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
