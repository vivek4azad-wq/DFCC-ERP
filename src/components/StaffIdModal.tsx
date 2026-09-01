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

    // Build rich verifiable QR link for live mobile phone scanning
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://raildairy-dfcc.web.app';
    const targetStaffId = String(staff.awpoId || staff.staffId || staff.id || '');
    const qrPayload = `${origin}/?verify_staff=${encodeURIComponent(targetStaffId)}`;

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
      {/* 🖨️ Specific Isolated Print Stylesheet for Landscape Printing */}
      <style>{`
        @page {
          size: landscape;
          margin: 4mm;
        }
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
            width: 140mm !important;
            max-width: 140mm !important;
            min-height: 88mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            border: 2.5px solid #0f2b5c !important;
            border-radius: 10px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            z-index: 999999 !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn no-print-bg">
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-white animate-scaleUp">
          
          {/* Top Header Bar with Deep Navy Background (Hidden in print) */}
          <div className="px-5 py-3.5 bg-[#0f2b5c] text-white flex items-center justify-between shadow-sm no-print">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪪</span>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                DFCCIL Staff Identity Card (Landscape Badge)
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

          {/* Modal Body & Printable Badge Canvas with Mobile-First Responsive Layout */}
          <div className="p-3 sm:p-5 bg-slate-50 dark:bg-slate-950 flex flex-col items-center w-full max-w-full overflow-y-auto max-h-[80vh]">
            
            {/* The Landscape ID Card Canvas */}
            <div
              id="dfccil-staff-id-print-area"
              className="w-full max-w-[700px] bg-white border-2 border-[#0f2b5c] rounded-2xl shadow-md overflow-hidden text-slate-900 p-3.5 sm:p-4.5"
            >
              {/* Card Header: DFCCIL Branding */}
              <div className="flex flex-wrap items-center justify-between border-b-2 border-[#0f2b5c] pb-2 mb-2.5 gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                    dfc
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] sm:text-xs font-black text-[#0f2b5c] uppercase tracking-tight leading-tight break-words">
                      Dedicated Freight Corridor Corporation of India Ltd.
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-600 font-bold mt-0.5">
                      IMSD-SMUN • Ambala Unit (P-Way Civil Department)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>OFFICIAL ID BADGE</span>
                </div>
              </div>

              {/* Responsive Card Body */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                
                {/* 1. Left Column / Top Section on Mobile: Photo & Badge */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-3 sm:gap-1.5 sm:w-28 shrink-0 sm:border-r border-slate-200 sm:pr-2 pb-2 sm:pb-0 border-b sm:border-b-0">
                  <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-inner flex items-center justify-center shrink-0">
                    {staff.photoUrl ? (
                      <img
                        src={staff.photoUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2b5c] to-blue-800 text-white p-1 text-center">
                        <span className="text-xl sm:text-2xl font-black">
                          {displayName.replace('Shri ', '').substring(0, 2).toUpperCase()}
                        </span>
                        <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider mt-1 opacity-90">
                          DFCCIL
                        </span>
                      </div>
                    )}
                  </div>

                  {/* QR Code on Mobile (Displayed side-by-side with photo for compact mobile view) */}
                  <div className="sm:hidden flex flex-col items-center justify-center">
                    <div className="p-1 bg-white rounded-lg border border-[#0f2b5c] shadow-xs">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt={`QR for ${displayName}`}
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center text-[7px] text-slate-400">
                          QR...
                        </div>
                      )}
                    </div>
                    <span className="text-[7px] font-mono font-bold text-[#0f2b5c] mt-0.5 uppercase tracking-wider">
                      SCAN TO VERIFY
                    </span>
                  </div>

                  <div className="hidden sm:block w-full text-center mt-1">
                    <span className="text-[8px] font-mono text-slate-600 font-bold uppercase block px-1 py-0.5 bg-slate-100 rounded border border-slate-200 truncate">
                      {displayCategory}
                    </span>
                  </div>
                </div>

                {/* 2. Middle Column: Flexible Details Grid with clean wrapping */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Name & Hindi Subtitle */}
                  <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <div className="font-black text-slate-900 text-sm sm:text-base leading-tight break-words">
                      {displayName}
                    </div>
                    {displayNameHi && (
                      <div className="text-xs text-blue-900 font-bold mt-0.5 break-words">
                        {displayNameHi}
                      </div>
                    )}
                  </div>

                  {/* Responsive Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 gap-y-1.5 text-xs sm:text-[11px] leading-tight">
                    <div className="break-words">
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block">
                        EMP / AWPO ID:
                      </span>
                      <span className="font-black text-[#0f2b5c] font-mono text-xs block">
                        {displayId}
                      </span>
                    </div>

                    <div className="break-words">
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block">
                        DESIGNATION:
                      </span>
                      <span className="font-bold text-slate-900 text-xs block">
                        {displayDesignation}
                      </span>
                    </div>

                    <div className="break-words">
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block">
                        FATHER'S NAME:
                      </span>
                      <span className="font-semibold text-slate-800 block">
                        {displayFatherName}
                      </span>
                    </div>

                    <div className="break-words">
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block">
                        BEAT / POSTING:
                      </span>
                      <span className="font-semibold text-slate-800 block">
                        {displayBeat}
                      </span>
                    </div>

                    <div className="break-words">
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block">
                        SECTION / KM:
                      </span>
                      <span className="font-mono font-semibold text-slate-800 text-[10px] sm:text-[11px] block">
                        {displayKmRange}
                      </span>
                    </div>

                    <div className="break-words">
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block">
                        MOBILE:
                      </span>
                      <span className="font-mono font-bold text-blue-700 block">
                        {rawPhone || '—'}
                      </span>
                    </div>

                    <div className="sm:col-span-2 break-words">
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block">
                        RESIDENCE / HQ:
                      </span>
                      <span className="text-slate-800 text-[10px] sm:text-[11px] block">
                        {displayResidence}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Right Column: High-Contrast QR Code on Desktop */}
                <div className="hidden sm:flex w-24 sm:w-28 shrink-0 flex-col items-center justify-center border-l border-slate-200 pl-2">
                  <div className="p-1 bg-white rounded-lg border-2 border-[#0f2b5c] shadow-sm">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`QR for ${displayName}`}
                        className="w-18 h-18 sm:w-20 sm:h-20 object-contain"
                      />
                    ) : (
                      <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center text-[8px] text-slate-400">
                        Loading QR...
                      </div>
                    )}
                  </div>
                  <span className="text-[7.5px] font-mono font-bold text-[#0f2b5c] mt-1 uppercase tracking-wider text-center block">
                    SCAN TO VERIFY
                  </span>
                  <div className="mt-1 text-[7px] text-slate-400 text-center font-bold">
                    IMSD SMUN
                  </div>
                </div>
              </div>

              {/* Card Footer Line */}
              <div className="border-t border-slate-200 mt-2 pt-1 flex items-center justify-between text-[8px] text-slate-500 font-medium">
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
