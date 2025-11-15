import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

const testUser = {
  email: 'frienduser@example.com',
  password: 'test1234',
  username: 'frienduser',
};

let app: INestApplication;
let jwtToken: string;

describe('친구 API (e2e)', () => {
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

  it('GET /api/v1/friends - 친구 목록 조회', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/friends')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('friends');
    expect(Array.isArray(res.body.friends)).toBe(true);
  });
});
