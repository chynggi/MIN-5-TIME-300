// frontend/src/app/register/page.tsx 생성 필요
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const { register, error } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !email) return;

    try {
      setIsLoading(true);
      await register({ username, password, email });
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      {/* 회원가입 폼 UI */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">회원가입</h1>
        
        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회원가입 폼 필드들 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              사용자명
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              이메일
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              비밀번호
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '처리 중...' : '회원가입'}
          </Button>
        </form>
        
        <p className="mt-4 text-center text-sm">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}