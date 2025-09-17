import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

const user = { email: 'qauser@example.com', password: 'test1234', username: 'qauser' };

describe('POST /api/v1/diaries/save-answers (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // sign up and login
    await request(app.getHttpServer()).post('/api/v1/signup').send(user).expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/login')
      .send({ email: user.email, password: user.password })
      .expect(201);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a journal on first save and updates same date on second save', async () => {
    const diaryDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const qa1 = {
      qa: [
        { domain: 'emotion', question: '오늘 기분은?', answer: '좋음' },
        { domain: 'action', question: '무엇을 했나?', answer: '운동' },
      ],
      diaryDate,
    };

    const res1 = await request(app.getHttpServer())
      .post('/api/v1/diaries/save-answers')
      .set('Authorization', `Bearer ${token}`)
      .send(qa1)
      .expect(201);

    expect(res1.body.id).toBeDefined();
    expect(Array.isArray(res1.body.selectedQuestions)).toBeTruthy();
    const firstId = res1.body.id as string;

    const qa2 = {
      qa: [
        { domain: 'emotion', question: '오늘 기분은?', answer: '보통' },
        { domain: 'action', question: '무엇을 했나?', answer: '독서' },
      ],
      diaryDate,
    };
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/diaries/save-answers')
      .set('Authorization', `Bearer ${token}`)
      .send(qa2)
      .expect(201);

    expect(res2.body.id).toBe(firstId);
    expect(res2.body.summary).toBeDefined();
  });
});
