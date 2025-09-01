'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { profileApi } from '../services/profile-api';
import { authApi } from '../services/auth-api';
import { ProfileResponse } from '../types/api';

interface AuthContextType {
  user: ProfileResponse | null;
  isAuthenticated: boolean; // 토큰 존재 여부 (user 로드 전 초기 단계 포함)
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const loadUser = async () => {
    try {
      const data = await profileApi.getProfile();
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setIsAuthenticated(true); // 토큰만 존재해도 인증상태로 간주 (user 비동기 로드 전)
      loadUser();
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    loadUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
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
