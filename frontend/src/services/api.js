import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 인증 오류가 발생했을 때 전역 상태를 업데이트하거나 리디렉션할 수 있음
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error("인증 오류:", error.response.data);
      // 로컬 스토리지 토큰 제거하기 전에 사용자에게 알림
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        // 로그인 페이지가 아닐 경우에만 리디렉션
        if (!window.location.pathname.includes('/login')) {
          alert('인증이 만료되었습니다. 다시 로그인해 주세요.');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;