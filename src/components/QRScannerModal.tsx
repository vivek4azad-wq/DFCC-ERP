/**
 * In-App QR Scanner & Personnel Verification Modal
 * DFCCIL IMSD SMUN Unit
 * Supports:
 * 1. Live Camera Stream Scanning (WebRTC)
 * 2. Photo / Image File Upload Scanner (jsQR offscreen canvas)
 * 3. Manual QR String Decoding
 * 4. Quick Official Roster Simulators
 */

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { parseStaffQRPayload, generateStaffQRPayload } from '../services/qr.ts';
import type { StaffQRPayload, OfficerStaffRecord } from '../types/index.ts';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Scan,
  Shield,
  User,
  Phone,
  RefreshCw,
  Sparkles,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleStaffList?: OfficerStaffRecord[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  sampleStaffList = []
}) => {
  const [decodedData, setDecodedData] = useState<StaffQRPayload | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraCaptureRef = useRef<HTMLInputElement | null>(null);
  const galleryPickRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setDecodedData(null);
      setError(null);
      setRawInput('');
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsScanningCamera(false);
  };

  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Direct camera stream is not supported in this browser. Please use the "Upload Photo" option below.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setIsScanningCamera(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      setError(
        `Camera permission not granted or camera busy. You can upload/take a photo using the button below or simulate with roster.`
      );
      setIsScanningCamera(false);
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleDecodePayload(code.data);
          stopCamera();
          return;
        }
      }
    }
    if (isScanningCamera) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  };

  // Image File Scanner using jsQR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Canvas context initialization failed.');
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleDecodePayload(code.data);
        } else {
          setError('No readable QR code found in the selected image. Please ensure the QR code is clearly visible and well-lit.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDecodePayload = (payloadString: string) => {
    setError(null);
    try {
      const parsed = parseStaffQRPayload(payloadString);
      setDecodedData(parsed);
    } catch (err: any) {
      setError(`Invalid QR Code: ${err.message}`);
      setDecodedData(null);
    }
  };

  const handleTestWithStaff = (staff: OfficerStaffRecord) => {
    try {
      const payloadString = generateStaffQRPayload(staff);
      setRawInput(payloadString);
      handleDecodePayload(payloadString);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(100vh - 24px)', height: 'auto' }}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">Personnel QR Verification Scanner</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="p-4 overflow-y-auto space-y-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Camera / Scan Mode Box */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-[190px] flex flex-col items-center justify-center p-4 text-center">
            {isScanningCamera ? (
              <div className="relative w-full aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover rounded-xl" />
                <div className="absolute inset-0 border-2 border-blue-500/80 rounded-xl m-4 animate-pulse pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-lg"></div>
                </div>
                <button
                  onClick={stopCamera}
                  className="absolute bottom-2 right-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold"
                >
                  Stop Camera
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Scan Field Officer / Staff Badge</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Scan using camera or upload a QR image from phone
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {/* Direct Native Android Camera Viewfinder via direct User Gesture */}
                  <label className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer active:scale-95">
                    <Camera className="w-4 h-4" />
                    <span>📸 Open Camera &amp; Scan</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Pick from Gallery */}
                  <label className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Gallery Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* WebRTC Live Stream Toggle */}
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                  >
                    <Scan className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Stream</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Test Badge Quick Simulators */}
          {sampleStaffList.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Simulate QR Scan (Official Roster)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sampleStaffList.slice(0, 4).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleTestWithStaff(s)}
                    className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition text-xs"
                  >
                    <div className="font-bold text-slate-200 truncate">{s.name}</div>
                    <div className="text-[10px] text-blue-400 truncate">{s.post}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual JSON / Raw Payload Input */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Manual QR Payload String
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder='Paste {"app":"RailDiary-DFCCIL", ...}'
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleDecodePayload(rawInput)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                Decode
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Verification Result Card */}
          {decodedData && (
            <div className="bg-gradient-to-b from-emerald-950/40 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Official DFCCIL Badge Verified
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {decodedData.app} v{decodedData.ver}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  {decodedData.name.replace('Shri ', '').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{decodedData.name}</h4>
                  <p className="text-xs text-blue-400 font-semibold">{decodedData.designation}</p>
                  <p className="text-[10px] font-mono text-slate-400">
                    Staff ID: {decodedData.staffId} {decodedData.awpoId ? `| AWPO: ${decodedData.awpoId}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/90 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 text-[10px] block">MOBILE</span>
                  <span className="text-slate-200 font-mono font-medium">{decodedData.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">HEADQUARTERS</span>
                  <span className="text-slate-200 font-medium truncate block">{decodedData.unit}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">ASSIGNED SECTION</span>
                  <span className="text-slate-200 font-medium">{decodedData.section}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">ROLE</span>
                  <span className="text-slate-200 capitalize font-medium">{decodedData.role}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold pt-1">
                <span>Status: Authenticated &amp; Active</span>
                <span className="font-mono text-slate-400">QR ID: {decodedData.qrId}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
