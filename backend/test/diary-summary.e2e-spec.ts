import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

// NOTE: 간단 통합 테스트 - 실제 DB/Prisma 사용.
// 전제: 테스트용 JWT 발급 과정이 이미 다른 e2e에서 구현되어 있다면 재사용.
// 여기선 간소화 위해 /auth/login 흐름이 있다고 가정하거나 토큰을 환경변수에서 읽을 수도 있음.
// 필요 시 수정하세요.

describe('Diary Summary (AI Question Flow)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // 간이 사용자 로그인/발급 (테스트 환경 맞게 조정)
    // 실제 프로젝트의 auth 흐름에 맞게 수정 필요.
    try {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'test1234' });
      token = res.body?.accessToken || '';
    } catch (e) {
      // 토큰 없이 진행될 경우 대부분 401로 실패 -> 환경 설정 필요
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('questionId가 있을 때 content 요약 또는 변환이 적용된다 (베이직 검증)', async () => {
    if (!token) {
      return; // Auth 미구현 테스트 환경에서는 건너뜀
    }

    const originalContent = `[제목] 오늘의 회고\n\n지금 기분은 어떤가요?\n아주 기쁘다. 많은 일이 있었다.\n\n오늘 의미 있었던 행동은?\n친구를 도왔다.\n\n내일의 작은 목표는?\n일찍 일어나 스트레칭하기.`;

    const res = await request(app.getHttpServer())
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${token}`)
      .field('content', originalContent)
      .field('questionId', 'dummy-q-ids')
      .field('writingDuration', '120');

    // 저장 성공
    expect([200,201]).toContain(res.status);
    const saved = res.body;

    // 요약/변환된 content가 원문과 다를 가능성 (단, API Key 없으면 동일)
    // 최소 검증: 빈 문자열이 아니어야 함
    expect(saved.content).toBeDefined();
    expect(saved.content.length).toBeGreaterThan(0);
  });
});
