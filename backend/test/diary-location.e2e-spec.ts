import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('일기 위치 저장 (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const user = {
    email: 'locuser@example.com',
    password: 'test1234',
    username: 'locuser',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/signup')
      .send(user)
      .expect(201);
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/login')
      .send({ email: user.email, password: user.password })
      .expect(201);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/diaries - 위치 포함 생성', async () => {
    const form = {
      content: '위치 포함 테스트 일기',
      writingDuration: '30',
      isPublic: 'true',
      emotion: '😊',
      lat: '37.5665',
      lng: '126.9780',
    };
    const res = await request(app.getHttpServer())
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${token}`)
      .field(form)
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.lat).toBeCloseTo(parseFloat(form.lat));
    expect(res.body.lng).toBeCloseTo(parseFloat(form.lng));
  });

  it('DELETE /api/v1/diaries/:id - 작성자가 일기를 삭제할 수 있다', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${token}`)
      .field({ content: '삭제 테스트 일기', writingDuration: '15' })
      .expect(201);

    const diaryId = createRes.body.id;

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/v1/diaries/${diaryId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(deleteRes.body).toMatchObject({ id: diaryId, deleted: true });
  });
});
