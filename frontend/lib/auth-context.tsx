'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, User } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      setUser(null);
      // Only alert if account was explicitly deactivated
      if (err.message && err.message.toLowerCase().includes('deactivated')) {
        alert('Your account has been deactivated. Please contact canteen staff.');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [pathname]);

  const login = async (data: any) => {
    const res = await api.login(data);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      const role = res.data.user.role;
      if (role === 'admin') router.push('/admin');
      else if (role === 'staff') router.push('/staff');
      else router.push('/menu');
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

