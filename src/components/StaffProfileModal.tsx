/**
 * DFCCIL IMSD SMUN - Dynamic Staff Profile & Interactive QR Modal
 * Features:
 * - Complete personal, duty, beat, and medical (PME) details
 * - Dynamic Patrol Pair relationship display with one-click partner navigation
 * - Printable and Downloadable QR Code
 * - Mobile responsive design
 */

import React, { useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Phone,
  MessageSquare,
  Printer,
  Download,
  QrCode,
  Users,
  Shield,
  Calendar,
  MapPin,
  Clock,
  HardHat,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Share2,
  ExternalLink,
  Edit,
  Sparkles
} from 'lucide-react';
import type { OfficerStaffRecord } from '../types/index.ts';

interface StaffProfileModalProps {
  staff: OfficerStaffRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectPartner?: (partnerId: string) => void;
  onEditStaff?: (staff: OfficerStaffRecord) => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  staff,
  isOpen,
  onClose,
  onSelectPartner,
  onEditStaff
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'qr' | 'pair'>('profile');
  const printRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (staff) {
      // Generate QR Code with standard mobile route / staff identifier
      const qrPayload = JSON.stringify({
        app: "DFCCIL Rail Diary",
        unit: "IMSD SMUN",
        id: staff.id,
        empId: staff.employeeId || staff.awpoId || staff.id,
        awpoId: staff.awpoId,
        name: staff.name,
        post: staff.post,
        desig: staff.designation,
        cat: staff.staffCategory,
        duty: staff.dutyType,
        beat: staff.beatNo,
        km: staff.beatFromTo,
        phone: staff.phone,
        pme: staff.pmeDate,
        pair: staff.patrolPairId,
        partner: staff.patrolPartnerName,
        url: `raildiary://staff/${staff.id}`
      });

      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('QR generation error:', err);
      });
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  const isExServiceman = staff.staffCategory === 'EX_SERVICEMAN';
  const isPatrolman = staff.dutyType === 'PATROLMAN';
  const isKeyman = staff.dutyType === 'KEYMAN';

  // Handle Download QR as PNG
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${(staff.employeeId || staff.awpoId || staff.id).replace(/[^a-zA-Z0-9_-]/g, '_')}_${staff.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-cyan-400 border border-blue-500/30 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Official Staff Profile</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                DFCCIL IMSD SMUN • {staff.staffCategory || 'PERMANENT'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onEditStaff && (
              <button
                onClick={() => {
                  onEditStaff(staff);
                  onClose();
                }}
                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition text-xs flex items-center gap-1"
                title="Edit Staff Member"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs inside Profile */}
        <div className="flex items-center gap-1 bg-slate-950/80 px-4 py-2 border-b border-slate-800 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Staff Details
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Staff QR Badge</span>
          </button>
          {isPatrolman && staff.patrolPartnerName && (
            <button
              onClick={() => setActiveTab('pair')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'pair'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Patrol Pair ({staff.patrolPairId})</span>
            </button>
          )}
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs" ref={printRef}>
          {/* Top Banner Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
            {/* Avatar */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-blue-400/40 shadow-xl shrink-0 flex items-center justify-center text-white font-extrabold text-xl">
              {staff.photoUrl ? (
                <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
              ) : (
                staff.name.replace(/^Shri\s+/i, '').substring(0, 2).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-950 border border-blue-500/40 text-cyan-300">
                  {staff.staffCategory || 'PERMANENT'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                  {isExServiceman ? `AWPO: ${staff.awpoId || staff.id}` : `ID: ${staff.employeeId || staff.id}`}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-1 truncate">
                {staff.name}
              </h2>
              <p className="text-xs text-blue-400 font-semibold truncate">
                {staff.designation || staff.post}
              </p>
            </div>
          </div>

          {/* TAB 1: FULL PROFILE ATTRIBUTES */}
          {activeTab === 'profile' && (
            <div className="space-y-3">
              {/* Detailed Grid */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  <span>Deployment &amp; Identification</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Father's Name:</span>
                    <span className="text-white font-medium">{staff.fatherName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Duty / Trade:</span>
                    <span className="text-cyan-300 font-bold">{staff.dutyType || staff.post}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      {isExServiceman ? 'AWPO ID:' : 'Employee ID:'}
                    </span>
                    <span className="text-amber-400 font-mono font-bold">
                      {isExServiceman ? staff.awpoId : (staff.employeeId || staff.id)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Designation:</span>
                    <span className="text-slate-200 font-semibold">{staff.designation || staff.post}</span>
                  </div>
                </div>
              </div>

              {/* Beat & Location Details */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Jurisdiction &amp; Beat Roster</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Assigned Beat No.:</span>
                    <span className="text-emerald-400 font-bold">{staff.beatNo || 'HQ Section'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Km Chainage From-To:</span>
                    <span className="text-white font-mono">{staff.beatFromTo || 'Km 1167.210 - 1249.720'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Headquarters / Sector:</span>
                    <span className="text-slate-300">{staff.headquarters || 'IMSD SMUN'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Assigned Section:</span>
                    <span className="text-slate-300">{staff.assignedSection || 'SMUN Unit'}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Medical (PME) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dates &amp; Emergency Contacts</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Joining Date:</span>
                    <span className="text-white font-mono">{staff.joiningDate || staff.dateOfJoining || '2022-01-01'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Periodical Medical (PME):</span>
                    <span className="text-cyan-300 font-mono font-bold">{staff.pmeDate || '2026-12-31'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Primary Mobile:</span>
                    <span className="text-emerald-400 font-mono font-bold">{staff.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Emergency Contact:</span>
                    <span className="text-amber-400 font-mono">{staff.emergencyContact || staff.phone}</span>
                  </div>
                </div>
              </div>

              {/* Patrol Pair Link Preview (If Patrolman) */}
              {isPatrolman && (
                <div className="bg-gradient-to-r from-purple-950/60 to-slate-950 border-2 border-purple-500/40 p-4 rounded-2xl space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Linked Patrol Pair: {staff.patrolPairId || staff.beatNo}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-900/80 text-purple-200">
                      Night Patrol
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-purple-500/20">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Patrol Partner:</span>
                      <span className="text-white font-bold text-xs">
                        {staff.patrolPartnerName || 'Unassigned Partner'}
                      </span>
                    </div>

                    {staff.patrolPartnerId && onSelectPartner && (
                      <button
                        onClick={() => onSelectPartner(staff.patrolPartnerId!)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>View Partner Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STAFF QR CODE VIEW */}
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="bg-white p-5 rounded-3xl max-w-[260px] mx-auto shadow-2xl border-4 border-blue-500/30">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Staff QR Code" className="w-full h-auto" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                    Generating Official QR...
                  </div>
                )}
                <div className="mt-2 text-slate-900 font-mono font-bold text-[11px]">
                  {staff.employeeId || staff.awpoId || staff.id}
                </div>
                <div className="text-slate-700 font-bold text-xs">
                  {staff.name}
                </div>
                <div className="text-slate-500 text-[10px]">
                  {staff.designation || staff.post} • IMSD SMUN
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handleDownloadQR}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR PNG</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Print Badge</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PATROL PAIR DETAIL VIEW */}
          {activeTab === 'pair' && isPatrolman && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-950/80 to-slate-950 border-2 border-purple-500/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                  <div>
                    <span className="text-[10px] text-purple-300 font-bold uppercase">Patrol Beat Location</span>
                    <h3 className="text-sm font-black text-white">{staff.patrolPairId || staff.beatNo}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-900/60 px-2.5 py-1 rounded-lg">
                    {staff.beatFromTo}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-purple-900/30 border border-purple-500/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                        P1
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs">{staff.name}</div>
                        <div className="text-purple-300 text-[10px] font-mono">AWPO: {staff.awpoId || staff.id} (Current)</div>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-mono text-xs">{staff.phone}</span>
                  </div>

                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                        P2
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs">
                          {staff.patrolPartnerName || 'Assigned Partner'}
                        </div>
                        <div className="text-amber-400 text-[10px] font-mono">
                          AWPO: {staff.patrolPartnerId || 'AWPO-Linked'}
                        </div>
                      </div>
                    </div>

                    {staff.patrolPartnerId && onSelectPartner && (
                      <button
                        onClick={() => onSelectPartner(staff.patrolPartnerId!)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar with Call & WhatsApp */}
        <div className="bg-slate-950 p-4 border-t border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <a
              href={`tel:${staff.phone.replace(/[^0-9+]/g, '')}`}
              className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>

            <a
              href={`https://wa.me/91${staff.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
