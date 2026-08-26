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
import { ChangePinModal } from './components/ChangePinModal.tsx';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  Train,
  ShieldCheck,
  Shield,
  User,
  Users,
  UserPlus,
  Key,
  KeyRound,
  Eye,
  EyeOff,
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
    changePin,
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
  const [authMode, setAuthMode] = useState<'officer' | 'pin' | 'guest' | 'signup' | 'otp'>('officer');

  // 1. Officer Sign In Form State (Real Firebase Auth)
  const [loginEmail, setLoginEmail] = useState('vkazad@dfcc.co.in');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2. Staff PIN Login State
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [staffPinError, setStaffPinError] = useState<string | null>(null);
  const [isStaffLoggingIn, setIsStaffLoggingIn] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  // 3. Staff Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhoneOrId, setSignUpPhoneOrId] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // 4. WhatsApp / SMS OTP Form State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // 5. Guest Visitor Modal State
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPurpose, setGuestPurpose] = useState('Track Inspection / Viewing');
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

  // 2. Handle Staff & MTS 4-Digit PIN Login
  const handleStaffPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffPinError(null);
    if (!staffIdentifier.trim()) {
      setStaffPinError('Please enter your Employee ID, Mobile Number or Name.');
      return;
    }
    if (!staffPin.trim() || staffPin.trim().length < 4) {
      setStaffPinError('Please enter your 4-digit PIN (e.g. 1234).');
      return;
    }

    setIsStaffLoggingIn(true);
    try {
      const res = await login(staffIdentifier.trim(), staffPin.trim());
      if (!res.success) {
        setStaffPinError(res.message || 'Invalid Employee ID/Mobile or 4-digit PIN.');
      }
    } catch (err: any) {
      setStaffPinError(err?.message || 'Authentication error occurred.');
    } finally {
      setIsStaffLoggingIn(false);
    }
  };

  // 3. Handle Official Staff Sign Up (Auto-Verification against Roster)
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
  // 2. IF NOT AUTHENTICATED: RENDER MODERN IRONLINE INDUSTRIAL LOGIN EXPERIENCE
  // -------------------------------------------------------------------------
  if (!isAuthenticated || !currentUser) {
    return (
      <div
        className="min-h-screen relative flex flex-col justify-between p-4 antialiased selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden bg-[#051424] text-white mission-control-bg"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)'
        }}
      >
        {/* 🚂 PANORAMIC FULL-SCREEN BACKGROUND RAILWAY CORRIDOR (Visible in side spaces & behind card) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
          {/* Subtle Atmospheric Mist & Spotlight Radial Glow */}
          <div className="absolute inset-0 bg-radial-gradient from-blue-600/10 via-transparent to-[#051424]/90" />

          {/* Upper High-Voltage OHE Catenary Wire spanning 100vw */}
          <div className="absolute top-[28%] left-0 right-0 w-full h-[1px] bg-cyan-400/30 animate-catenary-pulse" />
          <div className="absolute top-[29%] left-0 right-0 w-full h-[0.5px] bg-blue-500/20" />

          {/* Catenary Support Masts & Railway Signals in Wide Side Spaces */}
          <div className="absolute top-[20%] left-[6%] flex flex-col items-center opacity-70">
            <div className="w-1.5 h-36 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800 rounded-t" />
            <div className="w-6 h-3 bg-slate-900 border border-slate-700 rounded-sm -mt-36 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-signal-blink shadow-[0_0_8px_#34d399]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            </div>
            <span className="text-[8px] font-mono text-slate-500 mt-1">KM 1170</span>
          </div>

          <div className="absolute top-[20%] left-[22%] flex flex-col items-center opacity-40">
            <div className="w-1 h-36 bg-slate-700/60 rounded-t" />
            <div className="w-5 h-2.5 bg-slate-900 border border-slate-700 rounded-sm -mt-36 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-amber-400/80" />
            </div>
          </div>

          <div className="absolute top-[20%] right-[22%] flex flex-col items-center opacity-40">
            <div className="w-1 h-36 bg-slate-700/60 rounded-t" />
            <div className="w-5 h-2.5 bg-slate-900 border border-slate-700 rounded-sm -mt-36 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-emerald-400/80" />
            </div>
          </div>

          <div className="absolute top-[20%] right-[6%] flex flex-col items-center opacity-70">
            <div className="w-1.5 h-36 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800 rounded-t" />
            <div className="w-6 h-3 bg-slate-900 border border-slate-700 rounded-sm -mt-36 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-signal-blink shadow-[0_0_8px_#34d399]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            </div>
            <span className="text-[8px] font-mono text-slate-500 mt-1">KM 1245</span>
          </div>

          {/* Moving Freight Train with Locomotive & Cargo Wagons running across the screen */}
          <div className="absolute top-[32%] left-0 w-full">
            <div className="animate-fullscreen-train flex items-center">
              {/* High-Intensity Forward Headlight Beam Glow */}
              <div className="w-80 h-28 bg-gradient-to-r from-cyan-300/40 via-blue-500/10 to-transparent -mr-4 rounded-full blur-[6px] pointer-events-none transform -scale-x-100" />

              {/* High-Speed WAG-12 Twin Electric Locomotive */}
              <svg className="w-52 h-14 shrink-0 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" viewBox="0 0 240 50" fill="none">
                {/* Dual Pantographs with Electric Sparks */}
                <path d="M 45 15 L 55 5 L 68 5 L 78 15" stroke="#67e8f9" strokeWidth="2" />
                <circle cx="62" cy="5" r="2.5" fill="#38bdf8" className="animate-spark-glow" />
                <path d="M 160 15 L 170 5 L 183 5 L 193 15" stroke="#67e8f9" strokeWidth="2" />
                <circle cx="177" cy="5" r="2.5" fill="#38bdf8" className="animate-spark-glow" />

                {/* Locomotive Aerodynamic Cab */}
                <path d="M 12 40 L 28 17 C 32 15 40 15 46 15 L 225 15 C 232 15 236 19 236 26 L 236 40 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                {/* DFCCIL Front Windshield */}
                <path d="M 20 37 L 31 20 C 33 19 40 19 48 19 L 48 37 Z" fill="#030712" stroke="#67e8f9" strokeWidth="1" />
                {/* Twin Projector Headlights */}
                <circle cx="15" cy="34" r="3.5" fill="#ffffff" />
                <circle cx="15" cy="34" r="2" fill="#67e8f9" />
                <circle cx="24" cy="36" r="2" fill="#ffffff" />
                {/* Yellow Safety Speed Band */}
                <line x1="48" y1="28" x2="230" y2="28" stroke="#facc15" strokeWidth="3" />
                {/* DFCCIL Logo on Engine */}
                <rect x="100" y="20" width="40" height="7" rx="1.5" fill="#0f172a" stroke="#67e8f9" strokeWidth="0.8" />
                <text x="104" y="25.5" fill="#38bdf8" fontSize="5" fontWeight="bold" fontFamily="monospace">DFCCIL</text>
                {/* Heavy Cast Steel Bogies & Wheels */}
                <circle cx="42" cy="42" r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="68" cy="42" r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="170" cy="42" r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="196" cy="42" r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
              </svg>

              {/* Cargo Wagon 1 (DFCCIL Heavy Container) */}
              <svg className="w-36 h-14 shrink-0 -ml-1 drop-shadow-md" viewBox="0 0 160 50" fill="none">
                <rect x="5" y="16" width="150" height="24" rx="2" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
                <line x1="10" y1="20" x2="150" y2="20" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="50" y="31" fill="#93c5fd" fontSize="7" fontWeight="bold" fontFamily="monospace">DFCC CONTAINER</text>
                <circle cx="28" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="50" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="110" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="132" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
              </svg>

              {/* Cargo Wagon 2 (DFCCIL Heavy Container - Teal) */}
              <svg className="w-36 h-14 shrink-0 -ml-1 drop-shadow-md" viewBox="0 0 160 50" fill="none">
                <rect x="5" y="16" width="150" height="24" rx="2" fill="#065f46" stroke="#34d399" strokeWidth="1" />
                <text x="55" y="31" fill="#a7f3d0" fontSize="7" fontWeight="bold" fontFamily="monospace">SMUN FREIGHT</text>
                <circle cx="28" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="50" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="110" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="132" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
              </svg>

              {/* Guard / Brake Van */}
              <svg className="w-28 h-14 shrink-0 -ml-1 drop-shadow-md" viewBox="0 0 120 50" fill="none">
                <path d="M 5 40 L 5 20 L 105 20 L 115 28 L 115 40 Z" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
                <circle cx="110" cy="30" r="2.5" fill="#ef4444" className="animate-signal-blink" />
                <circle cx="30" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                <circle cx="85" cy="42" r="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          {/* Heavy Duty 60kg Steel Rails & Sleepers across 100vw */}
          <div className="absolute top-[39%] left-0 right-0 w-full">
            <div className="w-full h-[3px] bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-track-pulse" />
            <div className="w-full h-[1.5px] bg-slate-600 mt-[3px]" />
          </div>
        </div>

        {/* 🌟 ELEVATED MISSION CONTROL AUTHENTICATION CONTAINER (Center Focus) */}
        <div className="max-w-lg w-full mx-auto my-auto space-y-4 animate-fadeIn py-6 relative z-10">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-[0_0_25px_rgba(5,102,217,0.4)] border border-cyan-400/50 bg-[#0d234a]/90 backdrop-blur-md flex items-center justify-center p-1">
              <img src="/logo.png" alt="DFCCIL ERP Logo" className="w-full h-full object-contain drop-shadow" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md flex items-center justify-center gap-2">
                <span>DFCCIL ERP</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#0566d9] text-white uppercase tracking-widest shadow-sm border border-cyan-300/40">
                  IMSD SMUN
                </span>
              </h1>
              <p className="text-xs font-bold text-cyan-300 uppercase tracking-widest neon-glow mt-1">
                CIVIL ENGINEERING UNIT • KM 1167.210 TO KM 1249.720
              </p>
            </div>
          </div>

          {/* Status Banner from Stitch */}
          <div className="w-full glass-card rounded-2xl p-1 shadow-2xl">
            <div className="bg-[#051424]/80 rounded-xl p-3 flex justify-between items-center border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.08)]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-signal-blink shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                <span className="font-mono text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  SECTION CLEAR • GREEN SIGNAL
                </span>
              </div>
              <span className="font-mono text-slate-300 text-xs font-semibold">1167.210 → 1249.720</span>
            </div>
          </div>

          {/* Glassmorphic Ironline Auth Card */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white border border-slate-700/80">
            {/* Top Navigation Mode Tabs: Officer / Staff PIN / Guest */}
            <div className="grid grid-cols-3 gap-1 bg-[#020617] p-1.5 rounded-2xl border border-slate-800 text-xs font-bold select-none">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('officer');
                  setLoginError(null);
                }}
                className={`py-2.5 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  authMode === 'officer'
                    ? 'bg-[#0566d9] text-white shadow-[0_0_15px_rgba(5,102,217,0.5)] border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[11px]">Officer Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('pin');
                  setStaffPinError(null);
                }}
                className={`py-2.5 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  authMode === 'pin'
                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-cyan-300/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="text-[11px]">Staff PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('guest');
                  setGuestError(null);
                }}
                className={`py-2.5 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  authMode === 'guest'
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-[11px]">Guest (View)</span>
              </button>
            </div>

            {/* 1. Official Officer Sign In (Strict Check) */}
            {authMode === 'officer' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Official Officer Authentication
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300">SUPER-ADMIN / APM</span>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-semibold animate-fadeIn flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleStandaloneLogin} className="space-y-3 text-xs">
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
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
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
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Officer Credentials...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In as Officer</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 2. Field Staff & MTS PIN Login */}
            {authMode === 'pin' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Staff &amp; MTS PIN Login (पिन लॉगिन)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangePinOpen(true)}
                    className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1"
                  >
                    <span>पिन बदलें</span>
                  </button>
                </div>

                {staffPinError && (
                  <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-semibold animate-fadeIn flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{staffPinError}</span>
                  </div>
                )}

                <form onSubmit={handleStaffPinLogin} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Employee ID, Mobile Number or Name:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Arjun Kumar / 9876543210 / EMP-100619"
                        value={staffIdentifier}
                        onChange={e => setStaffIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        4-Digit PIN (4-अंकीय सुरक्षा पिन):
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsChangePinOpen(true)}
                        className="text-[10px] text-cyan-400 hover:underline"
                      >
                        Change PIN?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        maxLength={4}
                        pattern="\d{4}"
                        placeholder="••••"
                        value={staffPin}
                        onChange={e => setStaffPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-base font-mono font-black tracking-widest focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isStaffLoggingIn}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isStaffLoggingIn ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying PIN...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Staff Login with PIN</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Staff Roster Roster Links */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="font-bold text-slate-300 mb-1.5">Quick Select Staff (Requires PIN):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Arjun Kumar', id: 'EMP-100619', desig: 'Executive' },
                      { name: 'Pinki Sharma', id: 'EMP-100780', desig: 'MTS' },
                      { name: 'Sudhir Kumar', id: 'EMP-100892', desig: 'Keyman' },
                      { name: 'Ranjeet Singh', id: 'EMP-100890', desig: 'Keyman' },
                      { name: 'Store Keeper', id: 'store@dfcc.co.in', desig: 'Store' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setStaffIdentifier(p.id);
                          setStaffPin('');
                          setStaffPinError(null);
                        }}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-cyan-200 transition flex items-center gap-1"
                      >
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-slate-500 text-[9px]">({p.desig})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Guest Visitor Access (Strictly Read-Only) */}
            {authMode === 'guest' && (
              <div className="space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Guest Visitor Access (विज़िटर प्रवेश)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">READ-ONLY</span>
                </div>

                <div className="text-[11px] text-slate-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/40 leading-relaxed">
                  👁️ <strong>Read-Only Mode:</strong> Guests can inspect track linear diagrams, bridge inventories, curve telemetry, and staff directories without making any system changes.
                </div>

                {guestError && (
                  <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-semibold animate-fadeIn flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{guestError}</span>
                  </div>
                )}

                <form onSubmit={handleGuestLoginSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
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
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Mobile Number (10 Digits): *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98XXXXXXXX"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingGuest}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingGuest ? (
                      <span>Recording Guest Visit...</span>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-emerald-200" />
                        <span>Enter System in Guest Mode ➔</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Extra Options: Staff Sign Up / OTP */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setSignUpError(null);
                  setSignUpSuccess(null);
                }}
                className="hover:text-cyan-300 transition flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Staff Registration</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangePinOpen(true)}
                className="hover:text-cyan-300 transition flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Change PIN (पिन बदलें)</span>
              </button>
            </div>
          </div>

          {/* Sub-footer Developer Credits */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3 text-center text-xs space-y-0.5 text-slate-300">
            <div>
              Developed by: <span className="font-bold text-white">Shri Vivek Kumar Azad</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-medium">
              Assistant Project Manager / Civil
            </div>
            <div className="text-[10px] text-slate-500">
              Dedicated Freight Corridor Corporation of India Ltd. (IMSD SMUN)
            </div>
          </div>
        </div>

        {/* Change PIN Modal Component */}
        <ChangePinModal isOpen={isChangePinOpen} onClose={() => setIsChangePinOpen(false)} />
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
            <StationKeyPlanModal isOpen={true} isInline={true} onClose={() => setActiveTab('analytics')} />
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
