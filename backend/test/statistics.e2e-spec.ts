import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

const testUser = {
  email: 'statuser@example.com',
  password: 'test1234',
  username: 'statuser',
};

let app: INestApplication;
let jwtToken: string;

describe('통계/대시보드 API (e2e)', () => {
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await request(app.getHttpServer()).post('/api/v1/signup').send(testUser);
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/login')
      .send({ email: testUser.email, password: testUser.password });
    jwtToken = loginRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/statistics/dashboard - 대시보드 통계 조회', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/statistics/dashboard')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('writingStreak');
    expect(res.body).toHaveProperty('totalEntries');
    expect(res.body).toHaveProperty('averageEmotionScore');
  });
});
