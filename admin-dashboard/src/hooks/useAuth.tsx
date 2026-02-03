import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signIn, signOut, checkAdminExists } from '../services/supabase';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer' | 'analyst';
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  needsSetup: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSetup: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('admin_user');
      }
    }
    setLoading(false);

    // Check if setup is needed
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

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const adminUser = await signIn(email, password);
      const userData: AdminUser = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      };
      setUser(userData);
      localStorage.setItem('admin_user', JSON.stringify(userData));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, needsSetup, login, logout, checkSetup }}>
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
