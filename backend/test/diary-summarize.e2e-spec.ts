import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('POST /api/v1/diaries/summarize (e2e)', () => {
  let app: INestApplication;
  let token: string | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    try {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'test1234' });
      token = res.body?.accessToken;
    } catch {}
  });

  afterAll(async () => {
    await app.close();
  });

  it('요약 결과가 200~400자이며 이메일/전화번호가 제거되고, 흐름 키워드 일부가 포함된다', async () => {
    if (!token) return; // 인증 미구성 환경에서는 스킵

    const raw = `
[emotion] 오늘 기분은? 솔직히 조금 불안했다. 하지만 괜찮을 것도 같다.
[relationship] 팀장님과 이야기를 나눴다. 메일은 john.doe@example.com 으로 보냈다.
[recovery] 잠깐 산책을 하며 숨을 골랐다. 010-1234-5678 로 전화가 왔다.
[action] 내일을 위해 책상을 정리했다.
[goal] 내일 아침 10분 스트레칭을 해보고 싶다.
`;

    const res = await request(app.getHttpServer())
      .post('/api/v1/diaries/summarize')
      .set('Authorization', `Bearer ${token}`)
      .send({ rawContent: raw });

    expect([200, 201]).toContain(res.status);
    expect(res.body?.ok).toBe(true);

    const text: string = res.body?.text || '';
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThanOrEqual(200);
    expect(text.length).toBeLessThanOrEqual(400);

    // PII 마스킹 확인
    expect(text).not.toMatch(/john\.doe@example\.com/i);
    expect(text).not.toMatch(/010-1234-5678/);

    // 흐름 키워드 힌트(완벽 일치 강제 X): 감정/관계/회복/행동/목표 중 2개 이상 단어 존재 여부
    const hints = [
      '감정',
      '마음',
      '관계',
      '대화',
      '회복',
      '쉬어',
      '행동',
      '작은',
      '목표',
      '내일',
    ];
    const hitCount = hints.filter((h) => text.includes(h)).length;
    expect(hitCount).toBeGreaterThanOrEqual(2);
  });
});
