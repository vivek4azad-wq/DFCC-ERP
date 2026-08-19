/**
 * Personal QR Code & Official DFCCIL ID Badge Modal
 * DFCCIL IMSD SMUN Unit
 * Features:
 * - Dynamic High-Contrast Scannable QR Code
 * - Staff Photo Upload & Live Profile Image Display
 * - Printable / Downloadable Official Badge
 */

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { generateStaffQRPayload } from '../services/qr.ts';
import { db } from '../services/database.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Download,
  Printer,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Train,
  Camera,
  Upload,
  User,
  Heart
} from 'lucide-react';
import type { OfficerStaffRecord } from '../types/index.ts';

interface PersonalQRModalProps {
  staff: OfficerStaffRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onStaffUpdated?: (updatedStaff: OfficerStaffRecord) => void;
}

export const PersonalQRModal: React.FC<PersonalQRModalProps> = ({
  staff,
  isOpen,
  onClose,
  onStaffUpdated
}) => {
  const { currentUser, role } = useAuth();
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [currentStaff, setCurrentStaff] = useState<OfficerStaffRecord | null>(staff);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentStaff(staff);
  }, [staff]);

  useEffect(() => {
    if (!currentStaff || !isOpen) return;

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://raildairy-dfcc.web.app';
      const targetId = currentStaff.awpoId || currentStaff.employeeId || currentStaff.id;
      const payloadString = `${origin}/?verify_staff=${encodeURIComponent(targetId)}`;

      QRCode.toDataURL(
        payloadString,
        {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 260,
          color: {
            dark: '#020617',
            light: '#ffffff'
          }
        }
      )
        .then(url => {
          setQrDataUrl(url);
          setQrError(null);
        })
        .catch(err => {
          setQrError('Failed to generate QR code');
          console.error(err);
        });
    } catch (e: any) {
      setQrError(e.message || 'QR generation error');
    }
  }, [currentStaff, isOpen]);

  if (!isOpen || !currentStaff) return null;

  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          setIsUploadingPhoto(true);
          await db.updateDocument<OfficerStaffRecord>(
            'officers_staff',
            currentStaff.id,
            { photoUrl: base64 },
            currentUser
          );
          const updated = { ...currentStaff, photoUrl: base64 };
          setCurrentStaff(updated);
          if (onStaffUpdated) onStaffUpdated(updated);
        } catch (err: any) {
          alert(`Failed to save photo: ${err.message}`);
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `DFCCIL-QR-${currentStaff.id}-${currentStaff.name.replace(/\s+/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 24px)', height: 'auto' }}
      >
        {/* Modal Top Bar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">Personnel QR Verification Badge</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div
          className="p-4 flex-1 min-h-0 space-y-4"
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Printable Official DFCCIL ID Card */}
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-blue-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-center space-y-4">
            {/* Header Ribbon */}
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                  <Train className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold tracking-wider text-white uppercase">
                  DFCCIL • IMSD SMUN UNIT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight">
                Dedicated Freight Corridor Corporation of India Ltd.
              </p>
            </div>

            {/* Profile Photo & Info with Upload Option */}
            <div className="space-y-2">
              <div className="relative inline-block group">
                {currentStaff.photoUrl ? (
                  <img
                    src={currentStaff.photoUrl}
                    alt={currentStaff.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-400 shadow-xl mx-auto"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 border-2 border-white/20">
                    {currentStaff.name.replace('Shri ', '').substring(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Upload Photo Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border border-white/30 transition"
                  title="Upload / Change Staff Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {isUploadingPhoto && (
                <div className="text-[11px] text-blue-400 font-semibold animate-pulse">
                  Uploading staff photo...
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-white pt-1">{currentStaff.name}</h3>
                {currentStaff.nameHi && (
                  <p className="text-xs text-slate-400">{currentStaff.nameHi}</p>
                )}
                <div className="inline-block px-3 py-1 bg-slate-800 border border-slate-700 text-amber-300 text-xs font-mono font-bold rounded-lg mt-1 shadow-inner">
                  {currentStaff.employmentType === 'REGULAR'
                    ? `Employee ID: ${currentStaff.id}`
                    : `AWPO ID: ${currentStaff.awpoId || currentStaff.id}`}
                </div>
              </div>
            </div>

            {/* Generated High-Contrast QR Code */}
            <div className="bg-white p-3 rounded-2xl inline-block shadow-xl mx-auto border-4 border-slate-800">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${currentStaff.name}`}
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-500 text-xs">
                  {qrError || 'Generating QR Code...'}
                </div>
              )}
            </div>

            {/* Official Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono">{currentStaff.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{currentStaff.headquarters}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="capitalize">{currentStaff.employmentType.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Sec: {currentStaff.assignedSection}</span>
              </div>
            </div>

            {/* Verification Security Footer */}
            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Digitally Certified by DFCCIL IMSD SMUN ERP</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download QR</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Badge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
