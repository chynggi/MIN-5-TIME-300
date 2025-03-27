import React, { useState, useEffect } from 'react';
// BrowserRouter를 내보내지 않도록 변경
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WritingPage from './pages/WritingPage';
import SharedDiariesPage from './pages/SharedDiariesPage';
import ProfilePage from './pages/ProfilePage';
import api from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 토큰으로부터 사용자 정보 가져오기
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.get('/api/users/me');
      if (response.data && response.data.user) {
        setUser(response.data.user);
        console.log("사용자 정보 로드됨:", response.data.user.username);
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
      // 토큰이 유효하지 않은 경우 토큰 제거
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // 추가: 로그아웃 성공 알림
    alert("로그아웃되었습니다.");
    window.location.href = '/';
  };

  // 로그인 핸들러 (로그인 컴포넌트에서 호출)
  const handleLogin = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLogin} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/write" element={<WritingPage />} />
            <Route path="/shared" element={<SharedDiariesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;