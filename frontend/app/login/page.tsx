'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import styles from '@/styles/Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      console.error('로그인 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // 백엔드의 Google OAuth 엔드포인트로 리다이렉션
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>로그인</h1>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="이메일을 입력하세요"
              className={styles.input}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호를 입력하세요"
              className={styles.input}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className={styles.divider}>
          <span>또는</span>
        </div>
        
        <button 
          onClick={handleGoogleLogin}
          className={styles.googleLoginButton}
          type="button"
        >
          <div className={styles.googleButtonContent}>
            <svg className={styles.googleIcon} width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span>Google로 로그인</span>
          </div>
        </button>
        
        <div className={styles.links}>
          <Link href="/register" className={styles.registerLink}>
            계정이 없으신가요? 회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;