'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/lib/api/auth';
import { ProfileData } from '@/lib/api/profile';

type AuthContextType = {
  user: ProfileData | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: { 
    username: string;
    password: string;
    displayName: string;
    email: string;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (authService.isAuthenticated()) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const { user } = await authService.login(username, password);
      const fullUser = await authService.getCurrentUser();
      setUser(fullUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const register = async (userData: { 
    username: string;
    password: string;
    displayName: string;
    email: string;
  }) => {
    setIsLoading(true);
    try {
      await authService.register(userData);
      const user = await authService.getCurrentUser();
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};