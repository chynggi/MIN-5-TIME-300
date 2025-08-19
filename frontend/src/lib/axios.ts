import axios from "axios";

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL + "/api/v1") || "http://localhost:3001/api/v1",
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
