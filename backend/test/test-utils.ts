/**
 * MIN-5-TIME-300 API 테스트 유틸리티
 * 테스트에서 공통으로 사용하는 헬퍼 함수 모음
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

// 테스트용 사용자 타입
export interface TestUser {
  email: string;
  password: string;
  username: string;
  token?: string;
  id?: string;
}

// 테스트 사용자 생성 헬퍼
export function createTestUser(prefix: string = 'test'): TestUser {
  const timestamp = Date.now();
  return {
    email: `${prefix}_${timestamp}@test.com`,
    password: 'Test1234!',
    username: `${prefix}${timestamp}`,
  };
}

// 회원가입 및 토큰 획득
export async function signupAndGetToken(
  app: INestApplication,
  user: TestUser,
): Promise<TestUser> {
  const signupRes = await request(app.getHttpServer())
    .post('/api/v1/signup')
    .send({
      email: user.email,
      password: user.password,
      username: user.username,
    });

  if (signupRes.status !== 201) {
    throw new Error(`회원가입 실패: ${signupRes.status} - ${JSON.stringify(signupRes.body)}`);
  }

  return {
    ...user,
    id: signupRes.body.id,
    token: signupRes.body.token,
  };
}

// 로그인 및 토큰 획득
export async function loginAndGetToken(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ token: string; id: string }> {
  const loginRes = await request(app.getHttpServer())
    .post('/api/v1/login')
    .send({ email, password });

  if (loginRes.status !== 201) {
    throw new Error(`로그인 실패: ${loginRes.status} - ${JSON.stringify(loginRes.body)}`);
  }

  return {
    token: loginRes.body.token,
    id: loginRes.body.id,
  };
}

// 인증된 요청 헬퍼
export function authRequest(app: INestApplication, token: string) {
  return {
    get: (url: string) =>
      request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${token}`),
    
    post: (url: string) =>
      request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${token}`),
    
    put: (url: string) =>
      request(app.getHttpServer())
        .put(url)
        .set('Authorization', `Bearer ${token}`),
    
    patch: (url: string) =>
      request(app.getHttpServer())
        .patch(url)
        .set('Authorization', `Bearer ${token}`),
    
    delete: (url: string) =>
      request(app.getHttpServer())
        .delete(url)
        .set('Authorization', `Bearer ${token}`),
  };
}

// 랜덤 문자열 생성
export function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 날짜 포맷팅 (YYYY-MM-DD)
export function formatDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// 지연 헬퍼
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 재시도 래퍼
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await delay(delayMs);
      }
    }
  }
  
  throw lastError!;
}
