/**
 * Whole Store Inventory Master QR Code Modal
 * Generates high-res scannable QR Code linking to live store inventory
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Package,
  QrCode,
  Download,
  Copy,
  Check,
  Printer,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface StoreMasterQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalItems?: number;
}

export const StoreMasterQRModal: React.FC<StoreMasterQRModalProps> = ({
  isOpen,
  onClose,
  totalItems = 52
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getPublicUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://smun.firebaseapp.com';
    return `${origin}/?view=store_master`;
  };

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(getPublicUrl(), {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 320,
      color: {
        dark: '#0a1e3f',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Store Master QR generation failed:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'DFCCIL_IMSD_SMUN_Store_Master_QR.png';
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#0a1e3f] via-[#123363] to-[#0a1e3f] border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight block">
                Whole Store Inventory Master QR
              </span>
              <span className="text-[10px] text-amber-300 font-medium">
                DFCCIL IMSD SMUN • Live Material Stock
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Printable Badge Frame */}
          <div className="p-4 bg-white rounded-3xl border-4 border-[#0a1e3f] shadow-2xl flex flex-col items-center w-full max-w-[280px]">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded bg-red-600 text-white font-black text-[10px] flex items-center justify-center">
                dfc
              </div>
              <span className="text-[10px] font-black text-[#0a1e3f] uppercase tracking-tight">
                DFCCIL IMSD SMUN STORE
              </span>
            </div>

            <div className="w-56 h-56 flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden p-2 border border-slate-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Store Master QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Generating QR...</span>
                </div>
              )}
            </div>

            <div className="mt-2 text-center">
              <span className="text-[10px] font-black text-[#0a1e3f] tracking-wider uppercase block">
                SCAN FOR LIVE INVENTORY
              </span>
              <span className="text-[8px] text-slate-500 font-mono block">
                Real-Time Stock &bull; Receipts &bull; Issues
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">
              Any person or auditor scanning this QR code will see the full live stock register in real-time.
            </p>
            <p className="text-[11px] text-amber-300/90 font-mono">
              Includes all {totalItems} items, live balances, and DMTR movements.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full pt-2">
            <button
              onClick={handleDownloadQR}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download QR</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <a
            href={getPublicUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/20 transition"
          >
            <span>Open Live Inventory Page ↗</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
