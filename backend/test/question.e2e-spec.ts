import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';

const testUser = {
  email: 'geminitest@example.com',
  password: 'test1234',
  username: 'geminitest',
};

let app: INestApplication;
let jwtToken: string;
const logger = new Logger('QuestionE2ETest');

describe('Gemini 질문 생성 API (e2e)', () => {
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // 회원가입 및 로그인 후 토큰 획득
    await request(app.getHttpServer()).post('/api/v1/signup').send(testUser);
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/login')
      .send({ email: testUser.email, password: testUser.password });
    jwtToken = loginRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  for (let i = 0; i < 3; i++) {
    it(`POST /api/v1/questions/generate - Gemini 질문 생성 반복 테스트 #${i + 1}`, async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/questions/generate')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(201);
      expect(res.body).toHaveProperty('question');
      expect(typeof res.body.question).toBe('string');
      expect(res.body.question.length).toBeGreaterThan(0);
      // 반환된 질문을 터미널에 출력

      logger.log(`Gemini 생성 질문 #${i + 1}: ${res.body.question}`);
    });
  }
});
