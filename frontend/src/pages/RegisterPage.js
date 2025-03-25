import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        mbti: ''
    });
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        if(e.target.files && e.target.files[0]){
            setProfileImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        try {
            const payload = new FormData();
            payload.append('username', formData.username);
            payload.append('password', formData.password);
            payload.append('mbti', formData.mbti);
            if(profileImageFile) {
                payload.append('profile_image', profileImageFile);
            }

            const response = await api.post('/api/auth/register', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // 회원가입 성공 후 로그인 처리
            const loginResponse = await api.post('/api/auth/login', {
                username: formData.username,
                password: formData.password
            });

            localStorage.setItem('token', loginResponse.data.token);
            navigate('/');
        } catch (error) {
            console.error('Registration error:', error);
            setError(
                error.response?.data?.message ||
                '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        회원가입
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            로그인하기
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">
                                사용자 이름
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="사용자 이름"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="비밀번호"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">
                                비밀번호 확인
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="비밀번호 확인"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mt-4">
                            <label htmlFor="mbti" className="block text-sm font-medium text-gray-700">MBTI</label>
                            <input
                                id="mbti"
                                name="mbti"
                                type="text"
                                placeholder="예: INFP"
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                value={formData.mbti}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mt-4">
                            <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700">프로필 이미지</label>
                            <input
                                id="profile_image"
                                name="profile_image"
                                type="file"
                                accept="image/*"
                                className="mt-1 block w-full"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {loading ? '회원가입 중...' : '회원가입'}
                        </motion.button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default RegisterPage;