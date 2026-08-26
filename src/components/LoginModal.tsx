/**
 * Comprehensive Login Modal & Fast Role Switcher
 * DFCCIL IMSD SMUN Unit (Km 1167.210 – 1249.720)
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, Key, User, CheckCircle2, AlertTriangle, X, Lock, Sparkles, Building2, HardHat, UserCheck, Wrench, ShieldAlert } from 'lucide-react';
import type { UserRole } from '../types/index.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AUTHORIZED_PROFILES = [
  {
    id: 'EMP-101518',
    userId: '101518',
    name: 'Vivek Kumar Azad',
    nameHi: 'श्री विवेक कुमार आजाद',
    role: 'SUPER_ADMIN' as UserRole,
    roleTitle: 'APM / Civil (Super Admin)',
    pin: '1015',
    icon: Shield,
    badgeBg: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    dotBg: 'bg-purple-400',
    permissionTag: 'Full System Control · Master Overrides'
  },
  {
    id: 'OFF-101801',
    userId: '101801',
    name: 'Arjun Kumar',
    nameHi: 'अर्जुन कुमार',
    role: 'OFFICER' as UserRole,
    roleTitle: 'Executive / P-Way (Officer)',
    pin: '1801',
    icon: UserCheck,
    badgeBg: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    dotBg: 'bg-blue-400',
    permissionTag: 'P-Way Maintenance · Defects · Field Logs'
  },
  {
    id: 'OFF-102914',
    userId: '102914',
    name: 'Pinki Sharma',
    nameHi: 'पिंकी शर्मा',
    role: 'OFFICER' as UserRole,
    roleTitle: 'MTS / DFCCIL Representative',
    pin: '2914',
    icon: Sparkles,
    badgeBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    dotBg: 'bg-cyan-400',
    permissionTag: 'Daily Attendance & Absentee · Field Logs'
  },
  // 5 MTS Personnel (Gang Work Only)
  {
    id: 'OFF-101804',
    userId: '101804',
    name: 'Gautam Kumar',
    nameHi: 'गौतम कुमार',
    role: 'STAFF' as UserRole,
    roleTitle: 'MTS / Civil',
    pin: '1804',
    icon: Wrench,
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    dotBg: 'bg-amber-400',
    permissionTag: 'Track Gang Work Only (केवल गैंग कार्य)'
  },
  {
    id: 'OFF-101805',
    userId: '101805',
    name: 'Ranjeet Kumar',
    nameHi: 'रणजीत कुमार',
    role: 'STAFF' as UserRole,
    roleTitle: 'MTS / Civil',
    pin: '1805',
    icon: Wrench,
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    dotBg: 'bg-amber-400',
    permissionTag: 'Track Gang Work Only (केवल गैंग कार्य)'
  },
  {
    id: 'OFF-101806',
    userId: '101806',
    name: 'Sudhir Kumar',
    nameHi: 'सुधीर कुमार',
    role: 'STAFF' as UserRole,
    roleTitle: 'MTS / Civil',
    pin: '1806',
    icon: Wrench,
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    dotBg: 'bg-amber-400',
    permissionTag: 'Track Gang Work Only (केवल गैंग कार्य)'
  },
  {
    id: 'OFF-101807',
    userId: '101807',
    name: 'Suraj Verma',
    nameHi: 'सूरज वर्मा',
    role: 'STAFF' as UserRole,
    roleTitle: 'MTS / Civil',
    pin: '1807',
    icon: Wrench,
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    dotBg: 'bg-amber-400',
    permissionTag: 'Track Gang Work Only (केवल गैंग कार्य)'
  },
  {
    id: 'OFF-101808',
    userId: '101808',
    name: 'Sanni Kumar Sharma',
    nameHi: 'सन्नी कुमार शर्मा',
    role: 'STAFF' as UserRole,
    roleTitle: 'MTS / Civil',
    pin: '1808',
    icon: Wrench,
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    dotBg: 'bg-amber-400',
    permissionTag: 'Track Gang Work Only (केवल गैंग कार्य)'
  }
];

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'quick' | 'pin'>('quick');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleProfileSelect = (profile: typeof AUTHORIZED_PROFILES[0]) => {
    setError(null);
    setIdentifier(profile.userId);
    setPin('');
    setActiveTab('pin');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Please enter your Employee ID, Name, or Email.');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your PIN or Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, pin);
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Invalid ID or PIN.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">DFCCIL IMSD Authentication Gate</h2>
              <p className="text-xs text-slate-400">Authorized Personnel Role & Access Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        {currentUser && (
          <div className="bg-slate-950/60 px-5 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-400">Currently Logged In:</span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                role === 'SUPER_ADMIN' ? 'bg-purple-400' : role === 'OFFICER' ? 'bg-blue-400' : 'bg-emerald-400'
              }`} />
              {currentUser.name} ({role})
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            onClick={() => { setActiveTab('quick'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'quick'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Authorized Profiles (1-Click)</span>
          </button>
          <button
            onClick={() => { setActiveTab('pin'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'pin'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Employee ID / PIN Login</span>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {activeTab === 'quick' ? (
            <div className="space-y-3">
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Select your profile to authenticate with verified permissions:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AUTHORIZED_PROFILES.map(profile => {
                  const IconComp = profile.icon;
                  const isCurrent = currentUser?.id === profile.id || (currentUser?.name && currentUser.name.includes(profile.name));

                  return (
                    <button
                      key={profile.id}
                      onClick={() => handleProfileSelect(profile)}
                      disabled={isSubmitting}
                      className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 relative group ${
                        isCurrent
                          ? 'bg-blue-900/30 border-blue-500/60 ring-1 ring-blue-400'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${profile.badgeBg}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span className="truncate">{profile.name}</span>
                          <span className="text-[10px] text-cyan-400 font-mono font-bold">Select &amp; Enter PIN ➔</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5">{profile.roleTitle}</div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate">
                          {profile.permissionTag}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Employee ID, User ID, or Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="e.g. 101518, 101801, 102914, or Gautam"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  4-Digit Access PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    maxLength={8}
                    required
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="Enter your 4-digit PIN (e.g. 1015, 1801, 1804...)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
