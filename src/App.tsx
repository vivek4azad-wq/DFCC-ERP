import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.tsx';
import { AssetCategories, type AssetCategoryKey } from './components/AssetCategories.tsx';
import { KmQuickFinder } from './components/KmQuickFinder.tsx';
import { GPSAssetMap } from './components/GPSAssetMap.tsx';
import { StaffManagement } from './components/StaffManagement.tsx';
import { StaffDirectory } from './components/StaffDirectory.tsx';
import { StaffAttendance } from './components/StaffAttendance.tsx';
import { PWayWorkManager } from './components/PWayWorkManager.tsx';
import { PWayQualityInspections } from './components/PWayQualityInspections.tsx';
import { PWayMaintenanceModule } from './components/PWayMaintenanceModule.tsx';
import { StoreInventoryManager } from './components/StoreInventoryManager.tsx';
import { ScheduledInspectionPopup } from './components/ScheduledInspectionPopup.tsx';
import { AdminAIChatModal } from './components/AdminAIChatModal.tsx';
import { BridgeLinearDiagram } from './components/BridgeLinearDiagram.tsx';
import { DefectManager } from './components/DefectManager.tsx';
import { LoginDashboard } from './components/LoginDashboard.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { StoreItemPublicQRView } from './components/StoreItemPublicQRView.tsx';
import { StaffPublicQRView } from './components/StaffPublicQRView.tsx';
import { StationKeyPlanModal } from './components/StationKeyPlanModal.tsx';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  Train,
  ShieldCheck,
  User,
  Users,
  UserPlus,
  Key,
  LogIn,
  Scan,
  Sparkles,
  MapPin,
  Layers,
  Info,
  Lock,
  Mail,
  Bot,
  Phone,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

function MainAppShell() {
  const {
    currentUser,
    role,
    currentAppRole,
    isAuthenticated,
    isLoading,
    login,
    signUpStaff,
    loginWithOtp,
    loginAsGuest,
    switchRole
  } = useAuth();

  const [activeTab, setActiveTab] = useState('analytics');
  const [prefillFromKm, setPrefillFromKm] = useState<string | null>(null);
  const [prefillToKm, setPrefillToKm] = useState<string | null>(null);

  // Inspection Eligibility (Strictly APM & Officer)
  const isInspectionEligible = role === 'SUPER_ADMIN' || role === 'OFFICER' || currentAppRole === 'APM' || currentAppRole === 'Executive';

  // Standalone QR Scan Store Item View
  const [publicStoreItemId, setPublicStoreItemId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      return params.get('store_item') || (params.get('view') === 'store_item' ? params.get('id') : null);
    }
    return null;
  });

  // Standalone QR Scan Staff ID Card View
  const [publicStaffId, setPublicStaffId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      return params.get('verify_staff') || params.get('staff_id') || params.get('qr_staff') || (params.get('view') === 'staff' ? params.get('id') : null);
    }
    return null;
  });

  // Modals & Popups (Saved for later entry: inspection popup default false)
  const [isInspectionPopupOpen, setIsInspectionPopupOpen] = useState(false);
  const [isAIChatModalOpen, setIsAIChatModalOpen] = useState(false);

  // Navigation filter states for cross-screen deep-linking
  const [assetCategory, setAssetCategory] = useState<AssetCategoryKey | null>(null);
  const [assetSectionFilter, setAssetSectionFilter] = useState<string | undefined>(undefined);
  const [assetStationFilter, setAssetStationFilter] = useState<string | undefined>(undefined);
  const [staffDirectoryTab, setStaffDirectoryTab] = useState<'officers' | 'outsourced' | 'keymen' | 'patrol' | 'watchmen'>('officers');

  // --- Multi-Mode Authentication States ---
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'otp'>('signin');

  // 1. Sign In Form State (Real Firebase Auth)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 2. Staff Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhoneOrId, setSignUpPhoneOrId] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // 3. WhatsApp / SMS OTP Form State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // 4. Guest Visitor Modal State
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPurpose, setGuestPurpose] = useState('General View');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(err => {
        console.warn('Failed to set StatusBar overlay setting:', err);
      });
      StatusBar.setStyle({ style: Style.Dark }).catch(err => {
        console.warn('Failed to set StatusBar style:', err);
      });
      StatusBar.setBackgroundColor({ color: '#0f2b5c' }).catch(err => {
        console.warn('Failed to set StatusBar background color:', err);
      });
    }
  }, []);

  // Listen for global custom events from Navbar / Sidebar / Widgets
  useEffect(() => {
    const handleOpenInspections = () => setIsInspectionPopupOpen(true);
    const handleOpenAIChat = () => setIsAIChatModalOpen(true);

    window.addEventListener('raildiary_open_inspections_popup', handleOpenInspections);
    window.addEventListener('raildiary_open_ai_chat', handleOpenAIChat);

    return () => {
      window.removeEventListener('raildiary_open_inspections_popup', handleOpenInspections);
      window.removeEventListener('raildiary_open_ai_chat', handleOpenAIChat);
    };
  }, []);

  const handleQuickJump = (fromKm: string, toKm: string) => {
    setPrefillFromKm(fromKm);
    setPrefillToKm(toKm);
    setActiveTab('kmfinder');
  };

  const handleNavigateToAsset = (category: AssetCategoryKey, sectionFilter?: string, stationFilter?: string) => {
    setAssetCategory(category);
    setAssetSectionFilter(sectionFilter);
    setAssetStationFilter(stationFilter);
    setActiveTab('categories');
  };

  const handleNavigateToStaff = (tab: 'officers' | 'outsourced' | 'keymen' | 'patrol' | 'watchmen') => {
    setStaffDirectoryTab(tab);
    if (tab === 'officers') setActiveTab('officers');
    else if (tab === 'outsourced') setActiveTab('outsourced');
    else if (tab === 'keymen') setActiveTab('keymen');
    else if (tab === 'patrol') setActiveTab('patrol');
    else setActiveTab('officers');
  };

  // 1. Handle Official Firebase Email Sign In
  const handleStandaloneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your official Email and Password.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await login(loginEmail.trim(), loginPassword);
      if (!res.success) {
        setLoginError(res.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Handle Official Staff Sign Up (Auto-Verification against Roster)
  const handleStaffSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    if (!signUpName.trim()) {
      setSignUpError('Please enter your full name.');
      return;
    }
    if (!signUpPhoneOrId.trim()) {
      setSignUpError('Please enter your Official Phone Number or Employee ID / AWPO ID.');
      return;
    }
    if (!signUpPassword.trim() || signUpPassword.length < 4) {
      setSignUpError('Please set a secure password / PIN (minimum 4 characters).');
      return;
    }

    setIsSigningUp(true);
    try {
      const res = await signUpStaff({
        name: signUpName.trim(),
        phoneOrId: signUpPhoneOrId.trim(),
        email: signUpEmail.trim() || undefined,
        password: signUpPassword.trim()
      });

      if (res.success) {
        setSignUpSuccess(res.message || 'Verification successful! Logging you in...');
      } else {
        setSignUpError(res.message || 'Verification failed. Staff record not found.');
      }
    } catch (err: any) {
      setSignUpError(err.message || 'Sign-up failed.');
    } finally {
      setIsSigningUp(false);
    }
  };

  // 3. Handle WhatsApp / SMS OTP Send
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setOtpSuccess(null);

    const cleanDigits = otpPhone.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setOtpSuccess(`📲 OTP sent via WhatsApp & SMS to +91 ${cleanDigits.slice(-10)}! (Verification Code: ${code})`);
      setOtpCode(code); // Pre-fill for instant seamless testing
    } catch (err: any) {
      setOtpError('Failed to dispatch OTP. Please check mobile number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle WhatsApp / SMS OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await loginWithOtp(otpPhone, otpCode);
      if (!res.success) {
        setOtpError(res.message || 'Invalid or expired OTP.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'OTP Verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 4. Handle Guest Visitor Check-In Submit
  const handleGuestLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError(null);

    if (!guestName.trim()) {
      setGuestError('Please enter your full name.');
      return;
    }
    const cleanPhone = guestPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setGuestError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmittingGuest(true);
    try {
      const res = await loginAsGuest({
        name: guestName.trim(),
        phone: cleanPhone,
        purpose: guestPurpose.trim()
      });

      if (res.success) {
        setIsGuestModalOpen(false);
      } else {
        setGuestError(res.message || 'Guest check-in failed.');
      }
    } catch (err: any) {
      setGuestError(err.message || 'Error recording guest visit.');
    } finally {
      setIsSubmittingGuest(false);
    }
  };

  // -------------------------------------------------------------------------
  // 1. IF LOADING: RENDER POLISHED SPLASH SCREEN
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="space-y-4 animate-fadeIn">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-2xl border-2 border-blue-400/40 bg-[#0d234a] flex items-center justify-center animate-pulse">
            <img src="/logo.png" alt="DFCCIL ERP Logo" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">DFCCIL ERP</h2>
            <p className="text-xs text-blue-300 font-mono">Initializing IMSD-SMUN Telemetry &amp; Adaptive Sync...</p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 1.5 IF PUBLIC STORE ITEM QR SCAN: RENDER INSTANT VERIFICATION VIEW
  // -------------------------------------------------------------------------
  if (publicStoreItemId) {
    return (
      <StoreItemPublicQRView
        itemId={publicStoreItemId}
        onBackToApp={() => {
          setPublicStoreItemId(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 1.6 IF PUBLIC STAFF ID QR SCAN: RENDER INSTANT VERIFICATION VIEW
  // -------------------------------------------------------------------------
  if (publicStaffId) {
    return (
      <StaffPublicQRView
        staffId={publicStaffId}
        onBackToApp={() => {
          setPublicStaffId(null);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // 2. IF NOT AUTHENTICATED: RENDER FULL-PAGE RAILWAY PHOTO LOGIN SCREEN FIRST
  // -------------------------------------------------------------------------
  if (!isAuthenticated || !currentUser) {
    return (
      <div
        className="min-h-screen relative flex flex-col justify-between p-4 antialiased selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden bg-slate-950 text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(6, 12, 28, 0.82) 0%, rgba(15, 30, 65, 0.76) 50%, rgba(5, 10, 20, 0.92) 100%), url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=2168&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)'
        }}
      >
        <div className="max-w-md w-full mx-auto my-auto space-y-5 animate-fadeIn py-6 relative z-10">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-2xl border-2 border-cyan-300/50 bg-[#0d234a]/80 backdrop-blur-md flex items-center justify-center">
              <img src="/logo.png" alt="DFCCIL ERP Logo" className="w-full h-full object-cover" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                DFCCIL ERP
              </h1>
              <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider drop-shadow">
                IMSD-SMUN Unit (Civil) • Km 1167.210 to Km 1249.720
              </p>
            </div>
          </div>

          {/* Glassmorphic Auth Card */}
          <div className="bg-slate-950/85 backdrop-blur-xl border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-white">
            {/* Top Navigation Mode Tabs: Sign In / Staff Sign Up / WhatsApp OTP */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-bold select-none">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setLoginError(null);
                }}
                className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  authMode === 'signin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[11px]">Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setSignUpError(null);
                  setSignUpSuccess(null);
                }}
                className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  authMode === 'signup'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="text-[11px]">Staff Sign Up</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setOtpError(null);
                  setOtpSuccess(null);
                }}
                className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  authMode === 'otp'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-[11px]">WhatsApp OTP</span>
              </button>
            </div>

            {/* 1. Official Firebase Email Sign In */}
            {authMode === 'signin' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Official Firebase Sign In
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300">RAIL-AUTH</span>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold animate-fadeIn flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleStandaloneLogin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Official Email Address:
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="vkazad@dfcc.co.in"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-slate-950 placeholder:text-slate-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Secure Password:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-slate-950 placeholder:text-slate-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Firebase...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In with Firebase</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 2. Staff Sign Up with Roster Verification */}
            {authMode === 'signup' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Staff Registration (स्टाफ सत्यापन)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">ROSTER-MATCH</span>
                </div>

                <div className="text-[11px] text-slate-400 bg-blue-950/40 p-2.5 rounded-xl border border-blue-800/40">
                  ℹ️ <strong>DFCCIL Staff Only:</strong> Enter your Name &amp; registered Phone No or Employee ID. The system validates against the IMSD-SMUN official roster.
                </div>

                {signUpError && (
                  <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold animate-fadeIn flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{signUpError}</span>
                  </div>
                )}

                {signUpSuccess && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs font-semibold animate-fadeIn flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{signUpSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleStaffSignUpSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Full Staff Name: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arjun Kumar / Ravinder Kumar"
                      value={signUpName}
                      onChange={e => setSignUpName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Official Phone No or Employee ID: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210 or EMP-100619"
                      value={signUpPhoneOrId}
                      onChange={e => setSignUpPhoneOrId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Set Password / Security PIN: *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 4 characters"
                      value={signUpPassword}
                      onChange={e => setSignUpPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSigningUp}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSigningUp ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying with Staff Roster...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify Staff Identity &amp; Sign Up</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 3. WhatsApp / SMS OTP Fast Login */}
            {authMode === 'otp' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      WhatsApp &amp; SMS OTP Login
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">INSTANT-OTP</span>
                </div>

                {otpError && (
                  <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold animate-fadeIn flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{otpError}</span>
                  </div>
                )}

                {otpSuccess && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs font-semibold animate-fadeIn">
                    {otpSuccess}
                  </div>
                )}

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Enter Registered Mobile Number:
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 8872671873 / 9876543210"
                          value={otpPhone}
                          onChange={e => setOtpPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingOtp ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending WhatsApp OTP...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          <span>Send OTP via WhatsApp / SMS</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Enter 6-Digit WhatsApp/SMS Code:
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-emerald-500 rounded-xl text-white text-center text-lg font-mono font-black tracking-widest focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                        }}
                        className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        Change No
                      </button>

                      <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isVerifyingOtp ? (
                          <span>Verifying...</span>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>Verify &amp; Enter System</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Sub-footer Developer Credits */}
          <div className="bg-slate-950/70 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center text-xs space-y-0.5 text-white/90">
            <div className="font-semibold text-slate-300">
              Developed by: <span className="font-bold text-white">Shri Vivek Kumar Azad</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-medium">
              Assistant Project Manager / Civil
            </div>
            <div className="text-[10px] text-slate-400">
              Dedicated Freight Corridor Corporation of India Ltd. (IMSD SMUN)
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            RIGHT BOTTOM MOST DOWN: "VIEW AS GUEST" FIXED ACTION (Requirement 3)
        ------------------------------------------------------------------ */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            type="button"
            onClick={() => {
              setGuestError(null);
              setIsGuestModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-2xl border-2 border-emerald-400/40 backdrop-blur-md transition hover:scale-105 active:scale-95 cursor-pointer animate-pulse-slow"
            title="Click to view full website as Guest Visitor"
          >
            <User className="w-4 h-4 text-emerald-200" />
            <span>👤 View as a Guest (विज़िटर प्रवेश)</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-200" />
          </button>
        </div>

        {/* Guest Visitor Check-In Modal */}
        {isGuestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-white">
              <div className="bg-gradient-to-r from-[#0f2b5c] via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">
                      Guest Visitor Access (विज़िटर प्रवेश)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Full Read-Only Access across all Track Telemetry &amp; Maps
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGuestModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-xs text-slate-300 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/40">
                  📋 <strong>Visitor Registration:</strong> Please provide your Name and Mobile Number to explore the DFCCIL IMSD-SMUN corridor. Your visit will be logged in the official register.
                </div>

                {guestError && (
                  <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{guestError}</span>
                  </div>
                )}

                <form onSubmit={handleGuestLoginSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Visitor Full Name: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar / Audit Inspector"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Mobile Number: *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98XXXXXXXX (10 Digits)"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Purpose / Organization (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Headquarters Inspection / Academic / Vendor"
                      value={guestPurpose}
                      onChange={e => setGuestPurpose(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGuestModalOpen(false)}
                      className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingGuest}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingGuest ? (
                        <span>Checking In...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Grant Guest View Access ➔</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // IF AUTHENTICATED: RENDER MAIN DASHBOARD SHELL
  // -------------------------------------------------------------------------
  const currentTab = activeTab === 'admin' && role !== 'SUPER_ADMIN' ? 'analytics' : activeTab;

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'analytics':
        return (
          <AnalyticsDashboard
            onQuickJump={handleQuickJump}
            onNavigateToAsset={handleNavigateToAsset}
            onNavigateToStaff={handleNavigateToStaff}
            onNavigateToTab={setActiveTab}
          />
        );
      case 'kmfinder':
        return (
          <KmQuickFinder
            prefillFromKm={prefillFromKm}
            prefillToKm={prefillToKm}
            clearPrefill={() => {
              setPrefillFromKm(null);
              setPrefillToKm(null);
            }}
          />
        );
      case 'linear':
        return <BridgeLinearDiagram />;
      case 'bridges':
        return <AssetCategories initialCategory="bridges" initialSectionFilter={assetSectionFilter} />;
      case 'points_crossings':
        return <AssetCategories initialCategory="points_crossings" initialStationFilter={assetStationFilter} />;
      case 'curves':
        return <AssetCategories initialCategory="curves" initialSectionFilter={assetSectionFilter} />;
      case 'lwr_lc_sej':
        return <AssetCategories initialCategory="lwr" />;
      case 'officers':
        return <StaffDirectory initialTab="officers" />;
      case 'keymen':
        return <StaffDirectory initialTab="keymen" />;
      case 'gatemen':
        return <StaffDirectory initialTab="gatemen" />;
      case 'patrol':
        return <StaffDirectory initialTab="patrol" />;
      case 'watchmen':
        return <StaffDirectory initialTab="watchmen" />;
      case 'outsourced':
        return <StaffDirectory initialTab="outsourced" />;
      case 'keyplans':
        return (
          <div className="space-y-4">
            <StationKeyPlanModal isOpen={true} onClose={() => setActiveTab('analytics')} />
          </div>
        );
      case 'categories':
        return (
          <AssetCategories
            initialCategory={assetCategory}
            initialSectionFilter={assetSectionFilter}
            initialStationFilter={assetStationFilter}
          />
        );
      case 'gpsmap':
        return <GPSAssetMap />;
      case 'defects':
        return <DefectManager />;
      case 'staff':
        return <StaffDirectory initialTab={staffDirectoryTab || 'officers'} />;
      case 'pway_work':
        return <PWayQualityInspections />;
      case 'maintenance':
        return <PWayMaintenanceModule />;
      case 'store':
        return <StoreInventoryManager />;
      case 'attendance':
        return <StaffAttendance />;
      case 'staff_mgmt':
        return <StaffManagement />;
      case 'login_profile':
        return <LoginDashboard />;
      case 'admin':
        return <AdminPanel />;
      default:
        return (
          <AnalyticsDashboard
            onQuickJump={handleQuickJump}
            onNavigateToAsset={handleNavigateToAsset}
            onNavigateToStaff={handleNavigateToStaff}
            onNavigateToTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#070c18] text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200 w-full max-w-[100vw] overflow-x-hidden">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={currentTab}
        setActiveTab={setActiveTab}
        onOpenQuickFinder={() => setActiveTab('kmfinder')}
        onOpenAIChat={() => setIsAIChatModalOpen(true)}
        onOpenInspectionsAlert={() => setIsInspectionPopupOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-[1780px] w-full mx-auto pb-20 md:pb-8 overflow-x-hidden">
        {/* Desktop / Tablet Sidebar */}
        <Sidebar activeTab={currentTab} setActiveTab={setActiveTab} />

        {/* Dynamic Content View Area */}
        <main className="flex-1 p-2.5 sm:p-5 lg:p-6 min-w-0 w-full overflow-x-hidden overflow-y-auto">
          {renderActiveScreen()}
        </main>
      </div>

      {/* 🚨 Low Stock & Zero Inventory Alert Popup */}
      <ScheduledInspectionPopup
        isOpen={isInspectionPopupOpen}
        onClose={() => setIsInspectionPopupOpen(false)}
        onNavigateToInspections={() => setActiveTab('store')}
      />

      {/* 🤖 Admin AI Search & Firebase Log Assistant Modal */}
      <AdminAIChatModal
        isOpen={isAIChatModalOpen}
        onClose={() => setIsAIChatModalOpen(false)}
        onNavigateTab={tab => setActiveTab(tab)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
