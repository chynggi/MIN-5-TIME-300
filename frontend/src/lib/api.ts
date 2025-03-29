import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// axios 인스턴스 생성
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 쿠키 사용
});

// 인증 토큰 설정 함수
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
};

// 초기 토큰 설정 (페이지 로드 시)
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    setAuthToken(token);
  }
}

// Auth API
export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
};

// 질문 API
export const questionAPI = {
  getDailyQuestion: () => api.get('/questions'),
  getDailyQuestions: () => api.get('/questions/daily'),
};

// 일기 API
export const diaryAPI = {
  submitEntry: (content: string, isShared: boolean, rating: number) => 
    api.post('/diaries', { content, isShared, rating }),
  getUserEntries: () => api.get('/diaries'),
  getSharedEntries: () => api.get('/shared-entries'),
};

// 사용자 API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (profileData: any) => api.put('/user/profile', profileData),
  updateProfileImage: (formData: FormData) => api.post('/user/profile-image', formData),
};