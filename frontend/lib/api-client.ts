import axios from 'axios';

// API 기본 URL 설정 (백엔드 main.ts의 설정과 일치시킴)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use((config) => {
  // 브라우저 환경에서만 localStorage 접근
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러 (인증 실패) 처리
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // 로그인 페이지로 리디렉션 (로그인 페이지가 있다면)
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);