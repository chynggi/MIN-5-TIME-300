import { apiClient } from '../api-client';

export type AuthResponse = {
  accessToken: string; // 백엔드 코드 auth.service.ts에서 반환하는 형식
  user: {
    id: string;
    email: string;
    username: string;
    profileImage?: string;
  };
};

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', { username, password });
    // 로그인 성공 시 토큰 저장
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
    }
    return data;
  },

  register: async (userData: { 
    username: string;
    password: string;
    displayName: string;
    email: string;
  }): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', userData);
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
    }
    return data;
  },

  // Google 로그인
  googleLogin: async (googleAuthDto: { sub: string; email: string; name: string; picture?: string }): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/google', googleAuthDto);
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
    }
    return data;
  },

  // 로그아웃
  logout: (): void => {
    localStorage.removeItem('token');
  },

  // 현재 유저 정보 가져오기
  getCurrentUser: async () => {
    try {
      // 백엔드의 실제 엔드포인트 (user/profile)
      const { data } = await apiClient.get('/user/profile');
      return data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  // 인증 상태 확인
  isAuthenticated: (): boolean => {
    return typeof window !== 'undefined' && !!localStorage.getItem('token');
  },

  // Google OAuth 로그인 URL 반환
  getGoogleAuthUrl: () => {
    return `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  },

  // Google OAuth 콜백 처리
  handleGoogleCallback: async (token: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback?token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Google login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  }
};