import apiRequest from '../lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  username: string;
  token: string;
}

export const authApi = {
  // 로그인
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 회원가입
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    return apiRequest('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 로그아웃
  logout: async (): Promise<{ success: boolean; message: string }> => {
    return apiRequest('/logout', {
      method: 'POST',
    });
  },
};
