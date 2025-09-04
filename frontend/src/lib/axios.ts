import axios from "axios";
import { API_BASE_V1 } from "./baseUrl";

const api = axios.create({
  baseURL: API_BASE_V1,
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
