import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  signIn,
  signOut,
  checkAdminExists,
  validateSession,
  changePassword,
  getPasswordExpiryInfo
} from '../services/supabase';
import { is2FAEnabled } from '../services/twoFactorAuth';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer' | 'analyst';
  sessionToken?: string;
  sessionExpiry?: string;
  has2FA?: boolean;
}

interface LoginResult {
  passwordExpired: boolean;
  daysUntilPasswordExpiry: number;
  requires2FA: boolean;
  userId?: string;
}

interface PasswordExpiryInfo {
  changedAt: string;
  expiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  needsSetup: boolean;
  passwordExpiryInfo: PasswordExpiryInfo | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  checkSetup: () => Promise<boolean>;
  forcePasswordChange: (email: string, currentPassword: string, newPassword: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  complete2FALogin: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check session every 5 minutes

// Temporary storage for pending 2FA login
let pending2FALogin: {
  userData: AdminUser;
  sessionToken: string;
  sessionExpiry: string;
  passwordExpired: boolean;
  daysUntilPasswordExpiry: number;
} | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [passwordExpiryInfo, setPasswordExpiryInfo] = useState<PasswordExpiryInfo | null>(null);

  // Validate session on mount and periodically
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const storedUser = localStorage.getItem('admin_user');
    const storedSession = localStorage.getItem('admin_session');

    if (!storedUser || !storedSession) {
      setUser(null);
      return false;
    }

    try {
      const userData = JSON.parse(storedUser);
      const sessionData = JSON.parse(storedSession);

      // Check if session has expired locally
      if (sessionData.expiry && new Date(sessionData.expiry) < new Date()) {
        await logout();
        return false;
      }

      // Validate session with server
      const isValid = await validateSession(userData.id, sessionData.token);

      if (!isValid) {
        await logout();
        return false;
      }

      // Check 2FA status
      const has2FA = await is2FAEnabled(userData.id);
      setUser({ ...userData, has2FA });

      // Fetch password expiry info
      const expiryInfo = await getPasswordExpiryInfo(userData.id);
      setPasswordExpiryInfo(expiryInfo);

      return true;
    } catch (e) {
      console.error('Session validation error:', e);
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_session');
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial session check
    refreshSession().finally(() => setLoading(false));

    // Periodic session validation
    const intervalId = setInterval(() => {
      if (user) {
        refreshSession();
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [refreshSession, user]);

  // Check if setup is needed
  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const exists = await checkAdminExists();
      setNeedsSetup(!exists);
      return exists;
    } catch (error) {
      console.error('Setup check error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    try {
      const result = await signIn(email, password);

      // Check if 2FA is enabled
      const has2FA = await is2FAEnabled(result.id);

      const userData: AdminUser = {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        has2FA,
      };

      // If 2FA is enabled, store credentials temporarily and require 2FA verification
      if (has2FA) {
        pending2FALogin = {
          userData,
          sessionToken: result.sessionToken,
          sessionExpiry: result.sessionExpiry,
          passwordExpired: result.passwordExpired,
          daysUntilPasswordExpiry: result.daysUntilPasswordExpiry
        };

        return {
          passwordExpired: result.passwordExpired,
          daysUntilPasswordExpiry: result.daysUntilPasswordExpiry,
          requires2FA: true,
          userId: result.id
        };
      }

      // No 2FA - complete login immediately
      setUser(userData);
      localStorage.setItem('admin_user', JSON.stringify(userData));
      localStorage.setItem('admin_session', JSON.stringify({
        token: result.sessionToken,
        expiry: result.sessionExpiry
      }));

      // Fetch password expiry info
      const expiryInfo = await getPasswordExpiryInfo(result.id);
      setPasswordExpiryInfo(expiryInfo);

      return {
        passwordExpired: result.passwordExpired,
        daysUntilPasswordExpiry: result.daysUntilPasswordExpiry,
        requires2FA: false
      };
    } finally {
      setLoading(false);
    }
  };

  const complete2FALogin = async (userId: string) => {
    if (!pending2FALogin || pending2FALogin.userData.id !== userId) {
      throw new Error('No pending 2FA login found');
    }

    const { userData, sessionToken, sessionExpiry } = pending2FALogin;

    // Complete the login
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem('admin_session', JSON.stringify({
      token: sessionToken,
      expiry: sessionExpiry
    }));

    // Fetch password expiry info
    const expiryInfo = await getPasswordExpiryInfo(userId);
    setPasswordExpiryInfo(expiryInfo);

    // Clear pending login
    pending2FALogin = null;
  };

  const logout = async () => {
    const storedUser = localStorage.getItem('admin_user');
    let userId: string | undefined;

    if (storedUser) {
      try {
        userId = JSON.parse(storedUser).id;
      } catch (e) {
        // Ignore parse errors
      }
    }

    await signOut(userId);
    setUser(null);
    setPasswordExpiryInfo(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_session');
    pending2FALogin = null;
  };

  const forcePasswordChange = async (email: string, currentPassword: string, newPassword: string) => {
    // First verify current credentials
    const result = await signIn(email, currentPassword);

    // Then change password
    await changePassword(result.id, currentPassword, newPassword);

    // Clear session - user needs to re-login
    localStorage.removeItem('admin_session');
    pending2FALogin = null;
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Not logged in');

    await changePassword(user.id, currentPassword, newPassword);

    // Update password expiry info
    const expiryInfo = await getPasswordExpiryInfo(user.id);
    setPasswordExpiryInfo(expiryInfo);

    // Log out user - they need to re-login with new password
    await logout();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      needsSetup,
      passwordExpiryInfo,
      login,
      logout,
      checkSetup,
      forcePasswordChange,
      updatePassword,
      refreshSession,
      complete2FALogin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
