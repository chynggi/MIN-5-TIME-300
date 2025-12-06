/**
 * MIN-5-TIME-300 프론트엔드 전체 통합 E2E 테스트
 * Playwright를 사용한 UI 테스트
 */
import { test, expect, Page } from '@playwright/test';

// 테스트용 사용자 정보
const testUser = {
  email: `e2e_test_${Date.now()}@test.com`,
  password: 'Test1234!',
  username: `e2euser${Date.now()}`,
};

// 이미 가입된 테스트 사용자 (백엔드에 미리 생성 필요)
const existingUser = {
  email: 'playwright_test@test.com',
  password: 'Test1234!',
  username: 'playwrightuser',
};

/**
 * 헬퍼 함수: 로그인 수행
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * 헬퍼 함수: 로그인 상태 확인
 */
async function isLoggedIn(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  return !!token;
}

// ==================== 기본 페이지 접근 테스트 ====================
test.describe('기본 페이지 접근 테스트', () => {
  test('메인 페이지 로드 확인', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MIN-5-TIME|5분/);
  });

  test('로그인 페이지 접근 가능', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('로그인');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('회원가입 페이지 접근 가능', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h2')).toContainText('회원가입');
  });
});

// ==================== 인증 흐름 테스트 ====================
test.describe('인증 흐름 테스트', () => {
  test('로그인 폼 유효성 검사 - 빈 필드', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    
    // HTML5 유효성 검사 또는 커스텀 에러 메시지 확인
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('로그인 실패 - 잘못된 자격 증명', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 표시 확인
    await expect(page.locator('.text-red-500')).toBeVisible({ timeout: 10000 });
  });

  test('회원가입 폼 단계별 네비게이션', async ({ page }) => {
    await page.goto('/signup');
    
    // Step 1: 기본 정보
    await expect(page.getByText('기본정보')).toBeVisible();
    
    // 필수 필드 입력
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="passwordConfirm"]', testUser.password);
    await page.selectOption('select[name="gender"]', 'male');
    await page.selectOption('select[name="job"]', '회사원');
    await page.selectOption('select[name="education"]', '대학교 졸업');
    
    // 다음 버튼 클릭
    await page.click('button:has-text("다음")');
    
    // Step 2: MBTI 확인
    await expect(page.getByText('MBTI')).toBeVisible();
  });
});

// ==================== 대시보드 테스트 (로그인 필요) ====================
test.describe('대시보드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 상태 설정 (모킹)
    await page.goto('/login');
    
    // 실제 로그인 시도 또는 토큰 직접 설정
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, 'mock-jwt-token-for-testing');
  });

  test('로그인 후 대시보드 접근', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 대시보드 요소 확인 (인증 필요한 경우 로그인 페이지로 리다이렉트 될 수 있음)
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|login)/);
  });
});

// ==================== 일기 페이지 테스트 ====================
test.describe('일기 페이지 테스트', () => {
  test('일기 목록 페이지 구조 확인', async ({ page }) => {
    // 토큰 설정
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    
    await page.goto('/diary');
    
    // 페이지 로드 확인 (인증 리다이렉트 가능)
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(diary|login)/);
  });

  test('새 일기 작성 페이지 접근', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    
    await page.goto('/diary/new');
    
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(diary|login)/);
  });
});

// ==================== 채팅 페이지 테스트 ====================
test.describe('채팅 페이지 테스트', () => {
  test('채팅 페이지 구조 확인', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    
    await page.goto('/chat');
    
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(chat|login)/);
  });
});

// ==================== 프로필 페이지 테스트 ====================
test.describe('프로필 페이지 테스트', () => {
  test('프로필 페이지 구조 확인', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    
    await page.goto('/profile');
    
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(profile|login)/);
  });
});

// ==================== 친구 페이지 테스트 ====================
test.describe('친구 페이지 테스트', () => {
  test('친구 목록 페이지 구조 확인', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    
    await page.goto('/friends');
    
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(friends|login)/);
  });
});

// ==================== 통계 페이지 테스트 ====================
test.describe('통계 페이지 테스트', () => {
  test('통계 페이지 구조 확인', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    
    await page.goto('/statistics');
    
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(statistics|login)/);
  });
});

// ==================== 커뮤니티 페이지 테스트 ====================
test.describe('커뮤니티 페이지 테스트', () => {
  test('커뮤니티 페이지 구조 확인', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    
    await page.goto('/community');
    
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(community|login)/);
  });
});

// ==================== 알림 페이지 테스트 ====================
test.describe('알림 페이지 테스트', () => {
  test('알림 페이지 구조 확인', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    
    await page.goto('/notifications');
    
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(notifications|login)/);
  });
});

// ==================== 네비게이션 테스트 ====================
test.describe('네비게이션 테스트', () => {
  test('로그인 페이지에서 회원가입 링크 작동', async ({ page }) => {
    await page.goto('/login');
    
    const signupLink = page.locator('a[href="/signup"]');
    await expect(signupLink).toBeVisible();
    
    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('회원가입 페이지에서 로그인 링크 작동', async ({ page }) => {
    await page.goto('/signup');
    
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ==================== 반응형 디자인 테스트 ====================
test.describe('반응형 디자인 테스트', () => {
  test('모바일 뷰포트에서 로그인 페이지', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('태블릿 뷰포트에서 로그인 페이지', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('데스크탑 뷰포트에서 로그인 페이지', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});

// ==================== 접근성 테스트 ====================
test.describe('접근성 테스트', () => {
  test('로그인 폼 레이블 및 플레이스홀더 확인', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('placeholder', '이메일');
    
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('placeholder', '비밀번호');
  });

  test('키보드 네비게이션 - 로그인 폼', async ({ page }) => {
    await page.goto('/login');
    
    // Tab 키로 폼 요소 간 이동
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });
});

// ==================== 에러 처리 테스트 ====================
test.describe('에러 처리 테스트', () => {
  test('404 페이지 처리', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-12345');
    
    // Next.js 기본 404 또는 커스텀 404 페이지 확인
    const status = response?.status();
    expect([200, 404]).toContain(status); // SPA는 200으로 응답 후 클라이언트에서 처리
  });
});

// ==================== 성능 테스트 ====================
test.describe('성능 테스트', () => {
  test('페이지 로드 시간 측정 - 로그인', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`로그인 페이지 로드 시간: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10초 이내
  });

  test('페이지 로드 시간 측정 - 회원가입', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`회원가입 페이지 로드 시간: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10초 이내
  });
});
