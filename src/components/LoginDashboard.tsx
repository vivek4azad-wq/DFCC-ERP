/**
 * Login & User Profile Dashboard
 * Full authentication center, role delegation, RBAC status, and user profile management.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../services/database.ts';
import {
  Calendar,
  ShieldCheck,
  User,
  Key,
  LogIn,
  LogOut,
  CheckCircle2,
  Lock,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Train,
  QrCode,
  Sparkles,
  Shield,
  Layers,
  Clock,
  Eye,
  AlertCircle
} from 'lucide-react';
import type { UserRole } from '../types/index.ts';

interface LoginDashboardProps {
  onOpenQRModal?: () => void;
}

export const LoginDashboard: React.FC<LoginDashboardProps> = ({ onOpenQRModal }) => {
  const { currentUser, role, isAuthenticated, login, logout, switchRole } = useAuth();

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim() || !pin.trim()) {
      setErrorMessage('Please enter both User ID / Email and PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, pin);
      if (res.success) {
        setSuccessMessage('Authentication verified successfully!');
        setIdentifier('');
        setPin('');
      } else {
        setErrorMessage(res.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanPhone = currentUser?.phone ? currentUser.phone.replace(/[^0-9]/g, '') : '';
  const whatsappUrl =
    cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}`
      : `https://wa.me/${cleanPhone}`;

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Login &amp; User Profile Dashboard</h2>
            <p className="text-xs text-slate-400">
              Role-Based Access Control (RBAC) &amp; Identity Roster • DFCCIL IMSD SMUN Unit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wide border ${
              role === 'SUPER_ADMIN'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : role === 'OFFICER'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            ● Active: {role === 'SUPER_ADMIN' ? 'SUPER ADMIN (APM)' : role}
          </span>
        </div>
      </div>

      {/* Grid: Left Column (Profile & RBAC) + Right Column (Login & Role Switcher) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active User Profile Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* User Profile Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-blue-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Train className="w-40 h-40 text-blue-400" />
            </div>

            {/* Header Info */}
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 border-2 border-white/20 shrink-0">
                {currentUser?.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name ? currentUser.name.replace('Shri ', '').substring(0, 2).toUpperCase() : 'DF'
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {currentUser?.name || 'Guest User'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase ${
                      role === 'SUPER_ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : role === 'OFFICER'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {role}
                  </span>
                </div>

                <p className="text-xs font-semibold text-blue-400 mt-0.5">
                  {currentUser?.designation || 'DFCCIL IMSD SMUN Personnel'}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded font-mono">
                    User ID: {currentUser?.userId || currentUser?.id}
                  </span>
                  {currentUser?.awpoId && (
                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded font-mono">
                      AWPO: {currentUser.awpoId}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded">
                    Unit: IMSD SMUN
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details with Direct Actions */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
                Official Contact &amp; Headquarters
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Mobile No.</span>
                    <span className="font-mono font-bold text-white">{currentUser?.phone || '8872671873'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 block">Email ID</span>
                    <span className="font-mono text-slate-200 truncate block">
                      {currentUser?.email || 'vkazad@dfcc.co.in'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Headquarters</span>
                    <span className="font-semibold text-slate-200">NEW SHAMBHU (IMSD SMUN)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300">
                  <Train className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Jurisdiction</span>
                    <span className="font-semibold text-slate-200">Km 1167.210 – 1249.720 (88.68 Km)</span>
                  </div>
                </div>
              </div>

              {/* Direct Call & WhatsApp Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <a
                  href={`tel:${currentUser?.phone || '8872671873'}`}
                  className="flex-1 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Direct</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>

            {/* 🌟 MY PROFILE: OFFICIAL LEAVE BALANCES & ATTENDANCE STATUS */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    My Official Leave Balances (Leave Ledger)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Year 2026</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-blue-300 block">LAP (Earned)</span>
                  <span className="text-2xl font-black text-white mt-1 block">30</span>
                  <span className="text-[9px] text-slate-400">Days Available</span>
                </div>

                <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-indigo-300 block">LHAP (Medical)</span>
                  <span className="text-2xl font-black text-white mt-1 block">20</span>
                  <span className="text-[9px] text-slate-400">Days Available</span>
                </div>

                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-emerald-300 block">CL (Casual)</span>
                  <span className="text-2xl font-black text-white mt-1 block">8</span>
                  <span className="text-[9px] text-slate-400">Days Available</span>
                </div>

                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-amber-300 block">RH (Restricted)</span>
                  <span className="text-2xl font-black text-white mt-1 block">2</span>
                  <span className="text-[9px] text-slate-400">Days Available</span>
                </div>
              </div>

              {/* Attendance Status Summary */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-300">My Monthly Attendance Performance:</span>
                  <span className="font-bold text-emerald-400">96.2% Present Rate</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[11px] text-center font-mono">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">PRESENT</span>
                    <span className="font-black text-emerald-400">25 Days</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">ABSENT</span>
                    <span className="font-black text-slate-400">0 Days</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">LEAVES</span>
                    <span className="font-black text-amber-400">1 Day</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">REST/OFF</span>
                    <span className="font-black text-blue-400">4 Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RBAC Privileges Matrix */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Role Execution Privileges
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>View All Assets</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>KM Quick Finder</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>GPS Bridges Map</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Personal QR Badge</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
                  {role === 'SUPER_ADMIN' || role === 'OFFICER' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                  <span>Log Defects</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-300">
                  {role === 'SUPER_ADMIN' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                  <span>Edit/Delete Assets</span>
                </div>
              </div>
            </div>

            {/* Firebase Cloud Sync Box */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
                    <Train className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Cloud Firestore Linked</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Database: raildairy-dfcc</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ● Cloud Active
                </span>
              </div>

              {syncMsg && (
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-[11px] text-emerald-200 font-mono">
                  {syncMsg}
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsSyncingFirebase(true);
                    setSyncMsg(null);
                    const res = await db.syncAllToFirebase();
                    setSyncMsg(`Successfully synchronized ${res.totalSynced} items across ${res.collections.length} collections to Firebase Cloud!`);
                  } catch (err: any) {
                    alert(`Sync error: ${err.message}`);
                  } finally {
                    setIsSyncingFirebase(false);
                  }
                }}
                disabled={isSyncingFirebase}
                className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSyncingFirebase ? 'Synchronizing with Firestore...' : '☁️ Sync All Collections to Firebase'}</span>
              </button>
            </div>

            {/* Logout Action */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Storage: Local Persisted + Cloud Active
              </span>
              <button
                onClick={logout}
                className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Fast Role Switcher & Credentials Login Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Role Switcher */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Instant Role Switcher</h3>
            </div>
            <p className="text-xs text-slate-400">
              Select an authentic official role to test permission levels and UI views instantly:
            </p>

            <div className="space-y-2">
              {/* Super Admin */}
              <button
                onClick={() => switchRole('SUPER_ADMIN')}
                className={`w-full p-3 rounded-xl border transition flex items-center justify-between text-left ${
                  role === 'SUPER_ADMIN'
                    ? 'bg-purple-950/40 border-purple-500/60 text-purple-200 shadow-md shadow-purple-950/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Shri Vivek Kumar Azad</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded font-mono">
                      SUPER ADMIN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Assistant Project Manager / Civil (APM/Civil)
                  </div>
                </div>
                {role === 'SUPER_ADMIN' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
              </button>

              {/* Officer */}
              <button
                onClick={() => switchRole('OFFICER')}
                className={`w-full p-3 rounded-xl border transition flex items-center justify-between text-left ${
                  role === 'OFFICER'
                    ? 'bg-blue-950/40 border-blue-500/60 text-blue-200 shadow-md shadow-blue-950/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Shri Arjun Kumar</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-mono">
                      OFFICER
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Executive / Civil (IMSD Sectional)
                  </div>
                </div>
                {role === 'OFFICER' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </button>

              {/* Staff */}
              <button
                onClick={() => switchRole('STAFF')}
                className={`w-full p-3 rounded-xl border transition flex items-center justify-between text-left ${
                  role === 'STAFF'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Shri Ravinder Kumar</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono">
                      MTS STAFF
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Multi-Tasking Staff / Track Maintenance
                  </div>
                </div>
                {role === 'STAFF' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* IMSD SMUN Store Keeper */}
              <button
                onClick={() => login('SMUN', '2251')}
                className={`w-full p-3 rounded-xl border transition flex items-center justify-between text-left ${
                  currentUser?.userId === 'SMUN'
                    ? 'bg-blue-950/40 border-blue-500/60 text-blue-200 shadow-md shadow-blue-950/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>IMSD SMUN Store</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-mono font-bold">
                      SMUN STORE
                    </span>
                    <span className="text-[9px] px-1 bg-emerald-500/30 text-emerald-300 rounded">
                      Data Uploaded
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    User: <strong className="text-white font-mono">SMUN</strong> • Password: <strong className="text-white font-mono">2251</strong>
                  </div>
                </div>
                {currentUser?.userId === 'SMUN' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </button>

              {/* CHAN Store Keeper (Gyan) */}
              <button
                onClick={() => login('CHAN', '1234')}
                className={`w-full p-3 rounded-xl border transition flex items-center justify-between text-left ${
                  currentUser?.userId === 'CHAN'
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-md shadow-amber-950/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Shri Gyan Prakash (CHAN Store)</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono font-bold">
                      CHAN STORE
                    </span>
                    <span className="text-[9px] px-1 bg-amber-500/30 text-amber-300 rounded">
                      Entry Pending
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    User: <strong className="text-white font-mono">CHAN</strong> • Password: <strong className="text-white font-mono">1234</strong>
                  </div>
                </div>
                {currentUser?.userId === 'CHAN' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </div>

          {/* User Credentials Login Form */}
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Manual PIN &amp; ID Authentication</h3>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">User ID or Official Email:</label>
                <input
                  type="text"
                  placeholder="e.g. vkazad@dfcc.co.in or OFF-001"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Assigned Security PIN:</label>
                <input
                  type="password"
                  placeholder="e.g. 9999 / 1201 / 2001"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono tracking-widest focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Authenticate &amp; Verify Session</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
