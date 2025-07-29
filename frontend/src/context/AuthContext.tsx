'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { profileApi } from '../services/profile-api';
import { authApi } from '../services/auth-api';
import { ProfileResponse } from '../types/api';

interface AuthContextType {
  user: ProfileResponse | null;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileResponse | null>(null);

  const loadUser = async () => {
    try {
      const data = await profileApi.getProfile();
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    loadUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
