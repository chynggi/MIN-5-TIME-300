import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정 - MIN-5-TIME-300 프론트엔드 E2E 테스트
 */
export default defineConfig({
  testDir: './e2e',
  
  /* 테스트 파일 패턴 */
  testMatch: '**/*.e2e.ts',
  
  /* 병렬 실행 설정 */
  fullyParallel: true,
  
  /* CI 환경에서 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,
  
  /* CI에서 병렬 워커 수 제한 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 리포터 설정 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  /* 공통 테스트 설정 */
  use: {
    /* 기본 URL */
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    
    /* 트레이스 수집 (실패 시 첫 번째 재시도에서) */
    trace: 'on-first-retry',
    
    /* 스크린샷 (실패 시) */
    screenshot: 'only-on-failure',
    
    /* 비디오 녹화 (실패 시) */
    video: 'on-first-retry',
    
    /* 타임아웃 */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  /* 글로벌 타임아웃 */
  timeout: 60000,
  
  /* 브라우저 프로젝트 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* 모바일 뷰포트 테스트 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  /* 로컬 개발 서버 설정 (테스트 실행 전 자동 시작) */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
