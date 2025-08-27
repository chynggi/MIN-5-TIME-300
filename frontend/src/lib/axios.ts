import axios from "axios";

const api = axios.create({
  baseURL: (() => {
    let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    // 중복 방지를 위한 경로 확인
    if (url.includes('cafe24.com') && !url.includes('/api/v1')) {
      if (url.endsWith('/api')) {
        return url + '/v1';
      } else {
        return url.replace(/\/$/, '') + '/api/v1';
      }
    } else if (!url.includes('/api/v1')) {
      return url + '/api/v1';
    }
    return url;
  })(),
  withCredentials: true,
});

// JWT 토큰 자동 첨부 인터셉터 예시
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
