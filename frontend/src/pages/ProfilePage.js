import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api'; // axios 대신 api 인스턴스 사용

function PasswordModal({ isOpen, onClose }) {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await api.post('/api/user/update-password', passwords); // '/api/user/change-password' → '/api/user/update-password'
      onClose();
      alert('비밀번호가 성공적으로 변경되었습니다.');
    } catch (error) {
      setError('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-xl font-semibold mb-4">비밀번호 변경</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 비밀번호
            </label>
            <input
              type="password"
              name="current"
              value={passwords.current}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              name="new"
              value={passwords.new}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              name="confirm"
              value={passwords.confirm}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              변경
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    mbti: '',
    profile_image: null,
    created_at: null
  });
  const fileInputRef = useRef(null);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      // API 경로 수정
      await api.put('/api/user/profile', { // '/api/user/update' → '/api/user/profile'로 변경
        username: userData.username,
        email: userData.email,
        mbti: userData.mbti
      });
      setIsEditing(false);
      alert('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      alert('프로필 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/api/user/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // 백엔드 응답에 맞게 수정
      setUserData({ 
        ...userData, 
        profile_image: response.data.imageUrl // imageUrl이 백엔드에서 응답하는 필드명임을 확인
      });
    } catch (error) {
      console.error('이미지 업로드 오류:', error.response?.data || error.message);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 사용자 데이터 로드
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // API 경로를 백엔드 라우트에 맞게 수정
        const response = await api.get('/api/user/profile'); // '/api/user/me' → '/api/user/profile'로 변경
        setUserData(response.data);
      } catch (error) {
        console.error('사용자 데이터 로드 중 오류 발생:', error);
      }
    };
    fetchUserData();
  }, []);

  const profileImageUrl = userData.profile_image 
    ? `/uploads/${userData.profile_image}`
    : 'https://via.placeholder.com/150';

  return (
    <div className="p-6 bg-white rounded-md shadow-md max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">프로필</h2>
        <button
          onClick={handleEdit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {isEditing ? '취소' : '수정'}
        </button>
      </div>

      <div className="flex items-start space-x-6 mb-6">
        <div className="relative">
          <img
            src={profileImageUrl}
            alt="프로필 이미지"
            className="w-32 h-32 rounded-full object-cover cursor-pointer"
            onClick={handleImageClick}
          />
          {isEditing && (
            <>
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white text-sm cursor-pointer"
                onClick={handleImageClick}>
                이미지 변경
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </>
          )}
        </div>
        <div className="flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">사용자 이름</label>
            {isEditing ? (
              <input
                type="text"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            ) : (
              <p className="text-lg">{userData.username}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            {isEditing ? (
              <input
                type="email"
                value={userData.email || ''}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            ) : (
              <p className="text-lg">{userData.email || '이메일 미설정'}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">MBTI</label>
            {isEditing ? (
              <input
                type="text"
                value={userData.mbti || ''}
                onChange={(e) => setUserData({ ...userData, mbti: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="예: INFP"
                maxLength={4}
              />
            ) : (
              <p className="text-lg">{userData.mbti || '미설정'}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
            <p className="text-lg">
              {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : ''}
            </p>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            저장
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t">
        <h3 className="text-xl font-semibold mb-4">보안 설정</h3>
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          onClick={() => setIsPasswordModalOpen(true)}
        >
          비밀번호 변경
        </button>
      </div>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}

export default ProfilePage;