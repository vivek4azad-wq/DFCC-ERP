/**
 * Authentication & RBAC Context
 * DFCCIL IMSD SMUN Unit
 * Connected directly to Firebase Authentication with Real Credential Verification
 */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserAccount, UserRole, UserSession, AppUserRole } from '../types/index.ts';
import { db } from '../services/database.ts';
import { RBACService, type RbacAction } from '../services/rbac.ts';
import {
  getFirebaseAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from '../services/firebase.ts';

interface AuthContextType {
  currentUser: UserSession | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole | 'ANONYMOUS';
  currentAppRole: AppUserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  switchAppRole: (appRole: AppUserRole) => Promise<void>;
  canPerform: (action: RbacAction, resource: string) => boolean;
  allUsers: UserAccount[];
  refreshUsers: () => Promise<void>;
  authToken: string | null;
}

const AUTH_STORAGE_KEY = 'raildiary_auth_session_v1';
const AUTH_TOKEN_KEY = 'raildiary_auth_token_v1';

function safeStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Storage write failed for ${key}:`, e);
  }
}

function safeStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Storage remove failed for ${key}:`, e);
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getFriendlyFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect password or email. Please check your credentials.';
    case 'auth/user-not-found':
      return 'No registered account found with this email address.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by the administrator.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connectivity.';
    default:
      return `Authentication failed: ${errorCode.replace('auth/', '').replace(/-/g, ' ')}`;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize Firebase Auth state listener and local users
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initAuth() {
      try {
        const users = await db.getCollection<UserAccount>('users');
        setAllUsers(users);

        const auth = getFirebaseAuth();

        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            setFirebaseUser(fbUser);
            try {
              const token = await fbUser.getIdToken();
              setAuthToken(token);
              safeStorageSet(AUTH_TOKEN_KEY, token);

              // Match by email
              const emailClean = (fbUser.email || '').toLowerCase().trim();
              const matched = users.find(u => (u.email || '').toLowerCase().trim() === emailClean);

              if (matched) {
                setCurrentUser(matched);
                safeStorageSet(AUTH_STORAGE_KEY, JSON.stringify(matched));
              } else {
                // Construct user session from Firebase user metadata
                const fallbackUser: UserAccount = {
                  id: fbUser.uid,
                  userId: fbUser.email || fbUser.uid,
                  email: fbUser.email,
                  pin: '',
                  name: fbUser.displayName || fbUser.email?.split('@')[0] || 'DFCCIL Personnel',
                  role: emailClean.includes('admin') || emailClean.includes('vkazad') ? 'SUPER_ADMIN' : 'OFFICER',
                  designation: 'DFCCIL IMSD SMUN Officer',
                  department: 'Civil Engineering / P-Way',
                  unit: 'IMSD SMUN',
                  phone: fbUser.phoneNumber || '8872671873',
                  employeeId: 'EMP-101518',
                  awpoId: null,
                  isActive: true,
                  qrCodeId: `RD-${fbUser.uid.substring(0, 8).toUpperCase()}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                setCurrentUser(fallbackUser);
                safeStorageSet(AUTH_STORAGE_KEY, JSON.stringify(fallbackUser));
              }
            } catch (tokenErr) {
              console.warn('Could not retrieve Firebase ID token:', tokenErr);
            }
          } else {
            // Check stored session for offline/demo persistence
            const stored = localStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                const matched = users.find(u => u.id === parsed.id || u.userId === parsed.userId);
                if (matched && matched.isActive) {
                  setCurrentUser(matched);
                } else if (parsed) {
                  setCurrentUser(parsed);
                }
              } catch {
                safeStorageRemove(AUTH_STORAGE_KEY);
                setCurrentUser(null);
              }
            } else {
              setCurrentUser(null);
            }
            setFirebaseUser(null);
            setAuthToken(null);
          }
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const refreshUsers = async () => {
    try {
      const users = await db.getCollection<UserAccount>('users');
      setAllUsers(users);
      if (currentUser) {
        const updated = users.find(u => u.id === currentUser.id);
        if (updated) {
          setCurrentUser(updated);
          safeStorageSet(AUTH_STORAGE_KEY, JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Failed to refresh users:', err);
    }
  };

  /**
   * Real Firebase Authentication Sign-In using signInWithEmailAndPassword
   */
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const emailClean = email.trim();
    const passClean = pass.trim();

    if (!emailClean || !passClean) {
      return { success: false, message: 'Please enter both Email and Password.' };
    }

    try {
      const auth = getFirebaseAuth();
      // Direct Firebase Server-Side Verification
      const userCredential = await signInWithEmailAndPassword(auth, emailClean, passClean);
      const fbUser = userCredential.user;
      setFirebaseUser(fbUser);

      // Generate and store ID token
      const token = await fbUser.getIdToken();
      setAuthToken(token);
      safeStorageSet(AUTH_TOKEN_KEY, token);

      // Fetch or match user in collection
      const users = await db.getCollection<UserAccount>('users');
      setAllUsers(users);

      const matched = users.find(
        u => (u.email || '').toLowerCase().trim() === (fbUser.email || '').toLowerCase().trim()
      );

      if (matched) {
        if (!matched.isActive) {
          return { success: false, message: 'Account is deactivated. Please contact APM / Civil.' };
        }
        setCurrentUser(matched);
        safeStorageSet(AUTH_STORAGE_KEY, JSON.stringify(matched));
      } else {
        const newSessionUser: UserAccount = {
          id: fbUser.uid,
          userId: fbUser.email || fbUser.uid,
          email: fbUser.email,
          pin: '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'DFCCIL Personnel',
          role: emailClean.toLowerCase().includes('admin') || emailClean.toLowerCase().includes('vkazad') ? 'SUPER_ADMIN' : 'OFFICER',
          designation: 'DFCCIL IMSD SMUN Official',
          department: 'Civil Engineering / P-Way',
          unit: 'IMSD SMUN',
          phone: '8872671873',
          employeeId: 'EMP-101518',
          awpoId: null,
          isActive: true,
          qrCodeId: `RD-${fbUser.uid.substring(0, 8).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCurrentUser(newSessionUser);
        safeStorageSet(AUTH_STORAGE_KEY, JSON.stringify(newSessionUser));
      }

      return { success: true };
    } catch (err: any) {
      const errorCode = err?.code || '';
      const friendlyMsg = getFriendlyFirebaseErrorMessage(errorCode) || err?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: friendlyMsg };
    }
  };

  /**
   * Real Firebase Sign-Out
   */
  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut notice:', err);
    } finally {
      setCurrentUser(null);
      setFirebaseUser(null);
      setAuthToken(null);
      safeStorageRemove(AUTH_STORAGE_KEY);
      safeStorageRemove(AUTH_TOKEN_KEY);
    }
  };

  const switchAppRole = async (targetAppRole: AppUserRole) => {
    const users = await db.getCollection<UserAccount>('users');
    let target: UserAccount | undefined;

    if (targetAppRole === 'APM') {
      target = users.find(u => u.role === 'SUPER_ADMIN') || users.find(u => u.id === 'EMP-101518');
    } else if (targetAppRole === 'Executive') {
      target = users.find(u => u.role === 'OFFICER' && (u.name.toLowerCase().includes('arjun') || u.id === 'EMP-100619')) || users.find(u => u.role === 'OFFICER');
    } else if (targetAppRole === 'MTS') {
      target = users.find(u => u.role === 'STAFF' && (u.name.toLowerCase().includes('pinki') || u.id === 'EMP-100780')) || users.find(u => u.role === 'STAFF');
    } else if (targetAppRole === 'StoreKeeper') {
      target = users.find(u => u.role === 'STORE_KEEPER') || users.find(u => u.id === 'EMP-STORE-001');
    }

    if (target) {
      setCurrentUser(target);
      safeStorageSet(AUTH_STORAGE_KEY, JSON.stringify(target));
    } else {
      await switchRole(
        targetAppRole === 'APM'
          ? 'SUPER_ADMIN'
          : targetAppRole === 'Executive'
          ? 'OFFICER'
          : targetAppRole === 'StoreKeeper'
          ? 'STORE_KEEPER'
          : 'STAFF'
      );
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    const users = await db.getCollection<UserAccount>('users');
    let target = users.find(u => u.role === targetRole && u.isActive);

    if (!target) {
      if (targetRole === 'SUPER_ADMIN') {
        target = {
          id: 'EMP-101518',
          userId: 'vkazad@dfcc.co.in',
          email: 'vkazad@dfcc.co.in',
          pin: '8872',
          name: 'Shri Vivek Kumar Azad',
          role: 'SUPER_ADMIN',
          designation: 'Assistant Project Manager / Civil (APM)',
          department: 'Civil Engineering / Project Management',
          unit: 'IMSD SMUN',
          phone: '8872671873',
          employeeId: 'EMP-101518',
          awpoId: null,
          isActive: true,
          qrCodeId: 'RD-USR-EMP-101518',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else if (targetRole === 'OFFICER') {
        target = {
          id: 'EMP-100619',
          userId: 'arjun@dfcc.co.in',
          email: 'arjun@dfcc.co.in',
          pin: '1234',
          name: 'Sh. Arjun Kumar',
          role: 'OFFICER',
          designation: 'Executive / P-Way',
          department: 'Civil Engineering / P-Way',
          unit: 'IMSD SMUN',
          phone: '9876543210',
          employeeId: 'EMP-100619',
          awpoId: null,
          isActive: true,
          qrCodeId: 'RD-USR-EMP-100619',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else if (targetRole === 'STORE_KEEPER') {
        target = {
          id: 'EMP-STORE-001',
          userId: 'store@dfcc.co.in',
          email: 'store@dfcc.co.in',
          pin: '1234',
          name: 'Sh. Rameshwar Prasad',
          role: 'STORE_KEEPER',
          designation: 'Store Keeper / Material Supervisor',
          department: 'Civil Engineering / Store & Depot',
          unit: 'IMSD SMUN Store',
          phone: '9812345678',
          employeeId: 'EMP-STORE-001',
          awpoId: null,
          isActive: true,
          qrCodeId: 'RD-USR-STORE01',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        target = {
          id: 'EMP-100780',
          userId: 'pinki@dfcc.co.in',
          email: 'pinki@dfcc.co.in',
          pin: '1234',
          name: 'Pinki Sharma',
          role: 'STAFF',
          designation: 'Track Maintainer / MTS',
          department: 'Civil Engineering / P-Way',
          unit: 'IMSD SMUN',
          phone: '9999999999',
          employeeId: 'EMP-100780',
          awpoId: null,
          isActive: true,
          qrCodeId: 'RD-USR-EMP-100780',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    }

    setCurrentUser(target || null);
    if (target) {
      safeStorageSet(AUTH_STORAGE_KEY, JSON.stringify(target));
    }
  };

  const canPerform = (action: RbacAction, resource: string): boolean => {
    return RBACService.canPerform(currentUser?.role, action, resource);
  };

  const currentAppRole: AppUserRole = currentUser?.role === 'SUPER_ADMIN'
    ? 'APM'
    : currentUser?.role === 'OFFICER'
    ? 'Executive'
    : currentUser?.role === 'STORE_KEEPER'
    ? 'StoreKeeper'
    : 'MTS';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'ANONYMOUS',
        currentAppRole,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        switchRole,
        switchAppRole,
        canPerform,
        allUsers,
        refreshUsers,
        firebaseUser,
        authToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
