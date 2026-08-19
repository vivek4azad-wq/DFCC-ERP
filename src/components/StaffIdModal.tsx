/**
 * DFCCIL Staff ID Card Popup Modal & Single Card Printable Badge
 * Authentic Indian Railways / DFCCIL Design
 * Features:
 * - Isolation Print (@media print): Prints ONLY the ID card canvas with crisp borders and colors
 * - Desktop/Web Unclipped Names: Full word wrap and flexible grid so permanent staff & officer names never get truncated
 * - Verification QR Code: Scannable QR code with full staff record
 * - Direct Call, WhatsApp & Clean Print Triggers
 */

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Phone, MessageSquare, Printer, X, ShieldCheck } from 'lucide-react';

export interface UnifiedStaffModalData {
  id?: string | null;
  name: string;
  nameHi?: string | null;
  post?: string | null;
  designation?: string | null;
  role?: string | null;
  fatherName?: string | null;
  father_name?: string | null;
  beatNo?: number | string | null;
  beatNoText?: string | null;
  beatCode?: string | null;
  assignedSection?: string | null;
  sectionCode?: string | null;
  kmRange?: string | null;
  fromKm?: number | null;
  toKm?: number | null;
  beatFromTo?: string | null;
  phone?: string | null;
  mobileNo?: string | null;
  patrolmanPhone?: string | null;
  emergencyContact?: string | null;
  otherMobileNo?: string | null;
  altMobile?: string | null;
  residence?: string | null;
  headquarters?: string | null;
  district?: string | null;
  category?: string | null;
  staffCategory?: string | null;
  employmentType?: string | null;
  awpoId?: string | null;
  staffId?: string | null;
  photoUrl?: string | null;
  email?: string | null;
  bloodGroup?: string | null;
  [key: string]: any;
}

interface StaffIdModalProps {
  staff: UnifiedStaffModalData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffIdModal: React.FC<StaffIdModalProps> = ({ staff, isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!staff || !isOpen) return;

    // Build rich verifiable QR payload
    const qrPayload = JSON.stringify({
      app: 'DFCCIL-RailDiary-ID',
      id: staff.awpoId || staff.staffId || staff.id,
      name: staff.name,
      nameHi: staff.nameHi || '',
      designation: staff.post || staff.designation || 'Staff',
      unit: 'IMSD-SMUN • Ambala Unit',
      phone: staff.mobileNo || staff.phone || staff.patrolmanPhone || '',
      section: staff.assignedSection || staff.sectionCode || 'SMUN-SBJN',
      beat: staff.beatNoText || staff.beatCode || staff.beatNo || ''
    });

    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 260,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation failed:', err));
  }, [staff, isOpen]);

  if (!isOpen || !staff) return null;

  // Normalized display fields
  const displayId = (staff.awpoId || staff.staffId || staff.id || '53863').replace(/^AWPO-/i, 'AWPO-').replace(/^EMP-/i, 'EMP-');
  const displayName = staff.name || 'Staff Member';
  const displayNameHi = staff.nameHi || '';
  const displayDesignation = staff.post || staff.designation || (staff.beatNoText ? 'Keyman' : (staff.beatCode?.startsWith('SP') ? 'Patrolman' : 'Field Staff'));
  const displayFatherName = staff.fatherName || staff.father_name || '—';
  
  const displayBeat = staff.beatNoText || (staff.beatNo ? `Beat No. ${staff.beatNo}` : (staff.beatCode || staff.assignedSection || '—'));
  
  const displayKmRange = staff.kmRange || (staff.fromKm != null && staff.toKm != null 
    ? `${Number(staff.fromKm).toFixed(3)} to ${Number(staff.toKm).toFixed(3)}` 
    : (staff.beatFromTo || 'Km 1167.210 to 1170.435'));

  const rawPhone = staff.mobileNo || staff.phone || staff.patrolmanPhone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const displayAltPhone = staff.emergencyContact || staff.otherMobileNo || staff.altMobile || '—';

  const displayResidence = (staff.residence || staff.headquarters || 'IMSD SMUN HQ, Ambala').replace(/\n/g, ' ');
  const displayDistrict = staff.district || (displayResidence.toLowerCase().includes('patiala') ? 'Patiala' : 'Ambala');
  
  const displayCategory = staff.category || (staff.employmentType === 'REGULAR' ? 'Permanent (Regular)' : (staff.staffCategory === 'EX_SERVICEMAN' ? 'Ex-Serviceman' : 'Outsourced Staff'));

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 🖨️ Specific Isolated Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #dfccil-staff-id-print-area, #dfccil-staff-id-print-area * {
            visibility: visible !important;
          }
          #dfccil-staff-id-print-area {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 96mm !important;
            max-width: 96mm !important;
            padding: 0 !important;
            margin: 0 !important;
            border: 2px solid #0f2b5c !important;
            border-radius: 12px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            z-index: 999999 !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn no-print-bg">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-white animate-scaleUp">
          
          {/* Top Header Bar with Deep Navy Background (Hidden in print) */}
          <div className="px-5 py-3.5 bg-[#0f2b5c] text-white flex items-center justify-between shadow-sm no-print">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪪</span>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                DFCCIL Staff Identity Card
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body & Printable Badge Canvas */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
            
            {/* The Actual ID Card Canvas (Isolated during print) */}
            <div
              id="dfccil-staff-id-print-area"
              className="w-full bg-white border-2 border-[#0f2b5c] rounded-2xl shadow-md overflow-hidden text-slate-900 p-4 sm:p-5"
            >
              {/* Card Header: DFCCIL Branding */}
              <div className="flex items-center justify-between border-b-2 border-[#0f2b5c] pb-3 mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                    dfc
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-[#0f2b5c] uppercase tracking-tight leading-tight">
                      Dedicated Freight Corridor Corporation of India Ltd.
                    </h3>
                    <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                      IMSD-SMUN • Ambala Unit (P-Way Department)
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>OFFICIAL ID</span>
                </div>
              </div>

              {/* Card Body: Photo (Left) + Details Grid (Center) + QR Code (Right) */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                
                {/* 1. Profile Photo */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-inner flex items-center justify-center">
                    {staff.photoUrl ? (
                      <img
                        src={staff.photoUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2b5c] to-blue-800 text-white p-2 text-center">
                        <span className="text-3xl font-black">
                          {displayName.replace('Shri ', '').substring(0, 2).toUpperCase()}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-90">
                          DFCCIL
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 font-bold mt-1.5 uppercase">
                    {displayCategory}
                  </span>
                </div>

                {/* 2. Center: Flexible Details Grid (No clipping, long text wrapped) */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  
                  {/* Full Name & Hindi Subtitle */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      STAFF NAME / कर्मचारी का नाम
                    </span>
                    <div className="font-black text-slate-900 text-sm sm:text-base leading-tight break-words">
                      {displayName}
                    </div>
                    {displayNameHi && (
                      <div className="text-xs text-blue-900 font-bold mt-0.5 break-words">
                        {displayNameHi}
                      </div>
                    )}
                  </div>

                  {/* 2-Column Info Grid with word wrapping */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    
                    {/* ID & Designation */}
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        EMPLOYEE / AWPO ID
                      </span>
                      <span className="font-black text-[#0f2b5c] font-mono text-xs sm:text-sm block break-words">
                        {displayId}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        DESIGNATION / पद
                      </span>
                      <span className="font-bold text-slate-900 text-xs block break-words">
                        {displayDesignation}
                      </span>
                    </div>

                    {/* Father's Name & Beat */}
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        FATHER'S NAME
                      </span>
                      <span className="font-semibold text-slate-800 text-xs block break-words">
                        {displayFatherName}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        BEAT / POSTING
                      </span>
                      <span className="font-semibold text-slate-800 text-xs block break-words">
                        {displayBeat}
                      </span>
                    </div>

                    {/* KM Range & Mobile */}
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        SECTION / KM RANGE
                      </span>
                      <span className="font-mono font-semibold text-slate-800 text-[11px] block break-words">
                        {displayKmRange}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        CONTACT MOBILE
                      </span>
                      <span className="font-mono font-bold text-blue-700 text-xs block">
                        {rawPhone || '—'}
                      </span>
                    </div>

                    {/* Emergency Mobile & Residence */}
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        EMERGENCY NO.
                      </span>
                      <span className="font-mono text-slate-700 text-[11px] block">
                        {displayAltPhone}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        RESIDENCE / HQ
                      </span>
                      <span className="text-slate-800 text-[11px] leading-tight block break-words">
                        {displayResidence}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Right: High-Contrast QR Code */}
                <div className="shrink-0 flex flex-col items-center justify-center self-center sm:self-start pt-1">
                  <div className="p-1.5 bg-white rounded-xl border-2 border-[#0f2b5c] shadow-sm">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`QR for ${displayName}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-[9px] text-slate-400">
                        Loading QR...
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-mono font-bold text-[#0f2b5c] mt-1 uppercase tracking-wider">
                    SCAN TO VERIFY
                  </span>
                </div>
              </div>

              {/* Card Footer Line */}
              <div className="border-t border-slate-200 mt-3 pt-2 flex items-center justify-between text-[9px] text-slate-500 font-medium">
                <span>DFCCIL IMSD SHAMBHU UNIT • TRACK SAFETY ERP</span>
                <span>AUTHORIZED BADGE</span>
              </div>
            </div>

            {/* Action Buttons Row (Hidden in print) */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 no-print">
              <div className="flex items-center gap-2">
                {/* 📞 Call */}
                {cleanPhone && (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="px-3.5 py-2 bg-[#0f2b5c] hover:bg-[#1a4b8c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}

                {/* 💬 WhatsApp */}
                {cleanPhone && (
                  <a
                    href={`https://wa.me/91${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {/* 🖨️ Print ID Card */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print ID Card</span>
                </button>
              </div>

              {/* ✕ Close */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
