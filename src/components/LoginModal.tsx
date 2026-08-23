/**
 * Login Modal & Fast Role Switcher
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, Key, User, CheckCircle2, AlertTriangle, X, Lock, Sparkles, Building2 } from 'lucide-react';
import type { UserRole } from '../types/index.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, switchRole, currentUser, role } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Please enter your Employee Email, User ID, or AWPO ID.');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your 4-digit PIN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, pin);
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Login failed. Invalid ID or PIN.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSwitch = async (targetRole: UserRole) => {
    setError(null);
    await switchRole(targetRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">DFCCIL IMSD Authentication</h2>
              <p className="text-xs text-slate-400">Role-Based Access Control Gate</p>
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
            <span className="text-slate-400">Active Profile:</span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                role === 'SUPER_ADMIN' ? 'bg-purple-400' : role === 'OFFICER' ? 'bg-blue-400' : 'bg-emerald-400'
              }`} />
              {currentUser.name} ({role})
            </span>
          </div>
        )}

        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Official Firebase Registered Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. vkazad@dfcc.co.in"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Firebase Account Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Enter your Firebase password"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying with Firebase...' : 'Sign In via Firebase Auth'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
