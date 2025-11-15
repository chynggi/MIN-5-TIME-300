import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

// JWT 토큰 발급을 위한 테스트 계정 정보
const testUser = {
  email: 'testuser@example.com',
  password: 'test1234',
  username: 'testuser',
};

let app: INestApplication;
let jwtToken: string;

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

describe('Profile API (e2e)', () => {
  it('GET /api/v1/profile - 프로필 조회', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', testUser.email);
    expect(res.body).toHaveProperty('username', testUser.username);
  });

  it('PUT /api/v1/profile - 프로필 수정', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ username: 'updateduser' })
      .expect(200);
    expect(res.body).toHaveProperty('username', 'updateduser');
  });
});
