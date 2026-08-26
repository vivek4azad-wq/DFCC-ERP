/**
 * Change PIN Modal Component
 * Allows authenticated personnel and users on login screen to safely update their 4-digit PIN
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { KeyRound, Lock, CheckCircle2, AlertCircle, X, ShieldCheck, User } from 'lucide-react';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose, initialIdentifier }) => {
  const { currentUser, changePin } = useAuth();
  const [identifier, setIdentifier] = useState(initialIdentifier || currentUser?.userId || currentUser?.email || '101518');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      if (currentUser) {
        setIdentifier(currentUser.userId || currentUser.email || currentUser.employeeId || '');
      } else if (initialIdentifier) {
        setIdentifier(initialIdentifier);
      }
    }
  }, [isOpen, currentUser, initialIdentifier]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanId = identifier.trim();
    if (!currentUser && !cleanId) {
      setError('कृपया अपनी कर्मचारी आईडी (101518), ईमेल या मोबाइल नंबर दर्ज करें।');
      return;
    }

    if (!currentPin.trim()) {
      setError('कृपया अपना मौजूदा पासवर्ड (Vivek@101518) या पुराना पिन दर्ज करें।');
      return;
    }

    if (!/^\d{4}$/.test(newPin.trim())) {
      setError('नया पिन ठीक 4 अंकों का होना चाहिए (उदा. 1015, 1234)।');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError('नया पिन और कन्फर्म पिन मेल नहीं खाते।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePin(currentPin, newPin, cleanId);
      if (res.success) {
        setSuccess(res.message || '✅ पिन सफलतापूर्वक बदल दिया गया है!');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setError(res.message || 'पिन बदलने में विफलता। कृपया अपने क्रेडेंशियल्स की जांच करें।');
      }
    } catch (err: any) {
      setError(err?.message || 'पिन अपडेट करते समय त्रुटि हुई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a1e40] via-[#0f2b5c] to-[#123b72] p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-2xl border border-cyan-400/40 shadow-inner">
              <KeyRound className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Change 4-Digit PIN</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-400 text-slate-950 uppercase">
                  पिन बदलें
                </span>
              </h3>
              <p className="text-xs text-cyan-200/80">
                {currentUser ? `${currentUser.name} (${currentUser.designation || currentUser.role})` : 'DFCCIL Security PIN Update'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-300 bg-blue-950/40 p-3 rounded-2xl border border-blue-800/40 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              अपना मौजूदा पासवर्ड (उदा. <code className="text-cyan-300 font-mono font-bold">Vivek@101518</code>) या पुराना पिन दर्ज करके नया 4-अंकीय पिन सेट करें।
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* User Identifier (Shown if unauthenticated) */}
            {!currentUser && (
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Employee ID / Official Email / Phone: *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101518 or vkazad@dfcc.co.in"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Current Password or Old PIN: *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter Vivek@101518 or Old PIN"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                New 4-Digit Security PIN: *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="e.g. 1015"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base tracking-widest focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Confirm New 4-Digit PIN: *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="Re-enter 4-digit PIN"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base tracking-widest focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Updating PIN...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save New PIN</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
