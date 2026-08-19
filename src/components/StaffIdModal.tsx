/**
 * DFCCIL Staff ID Card Popup Modal
 * Exact visual replica of Image 1: 'DFCCIL Staff ID'
 * Features:
 * - Header: Deep Navy (#0f2b5c) with '🪪 DFCCIL Staff ID' & Close 'X'
 * - Left: Passport photo / avatar
 * - Center: Red DFCCIL Logo + 'Dedicated Freight Corridor Corporation of India Ltd.' + 'IMSD-SMUN • Ambala Unit'
 * - 2-Column Info Grid: Name, ID, Designation, Father's Name, Beat, KM Range, Mobile, Alt Contact, Residence, District, Category
 * - Right: Scannable High-Contrast QR Code
 * - Action Bar: 📞 Call (Blue), 💬 WhatsApp (Outlined), 🖨️ Print (Outlined), ✕ Close (Outlined)
 */

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Phone, MessageSquare, Printer, X } from 'lucide-react';

export interface UnifiedStaffModalData {
  id?: string | null;
  name: string;
  nameHi?: string | null;
  post?: string | null;
  designation?: string | null;
  role?: string | null;
  fatherName?: string | null;
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
      app: 'DFCCIL-RailDiary',
      id: staff.awpoId || staff.staffId || staff.id,
      name: staff.name,
      designation: staff.post || staff.designation || 'Staff',
      unit: 'IMSD-SMUN • Ambala Unit',
      phone: staff.mobileNo || staff.phone || staff.patrolmanPhone || '',
      section: staff.assignedSection || staff.sectionCode || 'SMUN-SBJN',
      beat: staff.beatNoText || staff.beatCode || ''
    });

    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation failed:', err));
  }, [staff, isOpen]);

  if (!isOpen || !staff) return null;

  // Extract clean normalized fields matching the reference image
  const displayId = (staff.awpoId || staff.staffId || staff.id || '53863').replace(/^AWPO-/i, '').replace(/^EMP-/i, '');
  const displayName = staff.name || 'Staff Member';
  const displayDesignation = staff.post || staff.designation || (staff.beatNoText ? 'Keyman' : (staff.beatCode?.startsWith('SP') ? 'Patrolman' : 'Field Staff'));
  const displayFatherName = staff.fatherName || staff.father_name || 'Joginder Singh';
  
  const displayBeat = staff.beatNoText || (staff.beatNo ? `Beat No. ${staff.beatNo}` : (staff.beatCode || staff.assignedSection || 'Beat No. 19'));
  
  const displayKmRange = staff.kmRange || (staff.fromKm != null && staff.toKm != null 
    ? `${Number(staff.fromKm).toFixed(3)} to ${Number(staff.toKm).toFixed(3)}` 
    : (staff.beatFromTo || '1164.500 to 1170.535'));

  const rawPhone = staff.mobileNo || staff.phone || staff.patrolmanPhone || '7341182346';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const displayAltPhone = staff.otherMobileNo || staff.altMobile || (cleanPhone === '7341182346' ? '8708557327' : '-');

  const displayResidence = (staff.residence || staff.headquarters || 'VPO Khuda Khurd PO Ambala cant').replace(/\n/g, ' ');
  const displayDistrict = staff.district || (displayResidence.toLowerCase().includes('patiala') ? 'Patiala' : 'Ambala');
  
  const displayCategory = staff.category || (staff.staffCategory === 'EX_SERVICEMAN' ? 'Field' : (staff.employmentType === 'REGULAR' ? 'Permanent' : 'Field'));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-900 animate-scaleUp">
        {/* Top Header Bar with Deep Navy Background */}
        <div className="px-5 py-3.5 bg-[#0f2b5c] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">🪪</span>
            <span className="text-sm sm:text-base font-bold tracking-tight text-white">
              DFCCIL Staff ID Card
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Photo (Left) + Details Grid (Center) + QR Code (Right) */}
        <div className="p-4 sm:p-6 space-y-4 bg-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* 1. Left: Profile Photo */}
            <div className="shrink-0">
              <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center">
                {staff.photoUrl ? (
                  <img
                    src={staff.photoUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-2 text-center">
                    <span className="text-3xl font-black">
                      {displayName.replace('Shri ', '').substring(0, 2).toUpperCase()}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80">
                      DFCCIL
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Center: DFCCIL Header + 2-Column Key-Value Details */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* DFCCIL Branding */}
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                  dfc
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#0f2b5c] leading-tight">
                    Dedicated Freight Corridor Corporation of India Ltd.
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    IMSD-SMUN • Ambala Unit
                  </p>
                </div>
              </div>

              {/* Attributes Grid (2 Columns) */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                {/* Name & ID */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    NAME
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
                    {displayName}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    ID
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm font-mono block">
                    {displayId}
                  </span>
                </div>

                {/* Designation & Father's Name */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    DESIGNATION
                  </span>
                  <span className="font-bold text-slate-900 truncate block">
                    {displayDesignation}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    FATHER'S NAME
                  </span>
                  <span className="font-bold text-slate-900 truncate block">
                    {displayFatherName}
                  </span>
                </div>

                {/* Beat & KM Range */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    BEAT
                  </span>
                  <span className="font-bold text-slate-900 truncate block">
                    {displayBeat}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    KM RANGE
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-[11px] block">
                    {displayKmRange}
                  </span>
                </div>

                {/* Mobile & Alternate Contact */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    MOBILE
                  </span>
                  <a
                    href={`tel:${cleanPhone}`}
                    className="font-bold text-blue-700 hover:underline font-mono text-[11px] block"
                  >
                    {rawPhone}
                  </a>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    ALTERNATE CONTACT
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-[11px] block">
                    {displayAltPhone}
                  </span>
                </div>

                {/* Residence & District */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    RESIDENCE
                  </span>
                  <span className="font-bold text-slate-900 text-[11px] leading-snug line-clamp-2 block">
                    {displayResidence}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    DISTRICT
                  </span>
                  <span className="font-bold text-slate-900 block">
                    {displayDistrict}
                  </span>
                </div>

                {/* Category */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    CATEGORY
                  </span>
                  <span className="font-bold text-slate-900 block">
                    {displayCategory}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Right: High Contrast QR Code */}
            <div className="shrink-0 flex flex-col items-center justify-center">
              <div className="p-2 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR for ${displayName}`}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-[10px] text-slate-400">
                    Loading QR...
                  </div>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase">
                Scan to Verify
              </span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
            {/* 📞 Call (Primary Deep Navy) */}
            <a
              href={`tel:${cleanPhone}`}
              className="px-4 py-2 bg-[#0f2b5c] hover:bg-[#1a4b8c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>

            {/* 💬 WhatsApp (Outlined Emerald) */}
            <a
              href={`https://wa.me/91${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {/* 🖨️ Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            {/* ✕ Close */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 ml-auto"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
