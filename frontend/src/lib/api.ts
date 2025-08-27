// API 기본 설정
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 프로덕션 환경에서 API 경로 수정 (중복 방지)
if (API_BASE_URL.includes('cafe24.com') && !API_BASE_URL.includes('/api/v1')) {
  if (API_BASE_URL.endsWith('/api')) {
    API_BASE_URL = API_BASE_URL + '/v1';
  } else {
    API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api/v1';
  }
} else if (!API_BASE_URL.includes('/api/v1')) {
  API_BASE_URL = API_BASE_URL + '/api/v1';
}

// JWT 토큰 가져오기
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // 여러 가능한 토큰 키 확인
    return localStorage.getItem('access_token') || 
           localStorage.getItem('accessToken') || 
           localStorage.getItem('token') ||
           localStorage.getItem('authToken');
  }
  return null;
};

// 토큰 설정 헬퍼 (테스트용)
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
};

// 토큰 제거 헬퍼
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
  }
};

// API 요청 헬퍼
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // FormData가 아닌 경우에만 Content-Type을 설정
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // 인증 에러 시 토큰 제거하고 로그인 페이지로 리다이렉트
      removeAuthToken();
      if (typeof window !== 'undefined') {
        // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          window.location.href = '/login';
        }
      }
      throw new Error('인증이 필요합니다. 로그인 후 다시 시도해주세요.');
    }
    
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || `${response.status} ${response.statusText}`;
    } catch {
      errorMessage = `${response.status} ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
};

export default apiRequest;

// API 연결 테스트
export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('API 연결 테스트 실패:', error);
    return false;
  }
};
