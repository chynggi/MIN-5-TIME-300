"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authAPI, setAuthToken } from "../lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  mbti?: string;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내에서 사용되어야 합니다");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 초기 로딩 시 토큰 확인 및 사용자 정보 로드
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 로컬 스토리지에서 토큰 확인
        const token = localStorage.getItem("token");
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // 토큰이 있으면 API 헤더에 설정
        setAuthToken(token);
        
        // 사용자 정보 로드
        const response = await fetch("http://localhost:3001/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // 토큰이 유효하지 않은 경우
          localStorage.removeItem("token");
          setAuthToken(null);
        }
      } catch (err) {
        console.error("Authentication check failed:", err);
        localStorage.removeItem("token");
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // 로그인 함수
  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const response = await authAPI.login({ username, password });
      const { token, user } = response.data;
      
      // 토큰 저장 및 설정
      localStorage.setItem("token", token);
      setAuthToken(token);
      
      // 사용자 상태 설정
      setUser(user);
      setIsAuthenticated(true);
      
      // 홈 페이지로 리디렉션
      router.push("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || "로그인에 실패했습니다");
      throw err;
    }
  };

  // 회원가입 함수
  const register = async (userData: { username: string; email: string; password: string }) => {
    setError(null);
    try {
      await authAPI.register(userData);
      
      // 회원가입 후 자동 로그인
      await login(userData.username, userData.password);
      
      // 홈 페이지로 리디렉션
      router.push("/");
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.message || "회원가입에 실패했습니다");
      throw err;
    }
  };

  // 로그아웃 함수
  const logout = () => {
    // 토큰 제거
    localStorage.removeItem("token");
    setAuthToken(null);
    
    // 사용자 상태 초기화
    setUser(null);
    setIsAuthenticated(false);
    
    // 로그인 페이지로 리디렉션
    router.push("/login");
  };

  // 에러 초기화
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
