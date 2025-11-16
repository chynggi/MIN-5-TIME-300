import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { readFileSync } from 'fs';
import { join } from 'path';

const MBTIS = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
] as const;

type LengthKey = 'short' | 'medium' | 'long' | 'very_long';
type StyleKey = 'emotional' | 'analytical' | 'action' | 'relationship';

interface GeneratedDiarySet {
  [mbti: string]: {
    [style in StyleKey]: {
      [length in LengthKey]: string;
    };
  };
}

interface FakeUserMeta {
  email: string;
  password: string;
  username: string;
  mbti: string;
  interests: { interest: string; priority?: number }[];
  lifestyle: { question: string; answer: string }[];
}

interface AuthenticatedUser extends FakeUserMeta {
  token: string;
}

function loadGeneratedData() {
  const base = join(__dirname, '..', 'test-data');
  const usersRaw = readFileSync(join(base, 'generated-users.json'), 'utf-8');
  const diariesRaw = readFileSync(join(base, 'generated-diaries.json'), 'utf-8');
  const users: FakeUserMeta[] = JSON.parse(usersRaw);
  const diaries: GeneratedDiarySet = JSON.parse(diariesRaw);
  return { users, diaries };
}

describe('MBTI diary save answers E2E (mass test)', () => {
  let app: INestApplication;
  let httpServer: any;
  let userMap: Record<string, AuthenticatedUser[]> = {};
  let diaries: GeneratedDiarySet;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    httpServer = app.getHttpServer();

    const data = loadGeneratedData();
    diaries = data.diaries;

    // MBTI별 signup + login 미리 수행
    userMap = {};

    for (const mbti of MBTIS) {
      const candidates = data.users.filter((u) => u.mbti === mbti);
      userMap[mbti] = [];

      for (const u of candidates) {
        // signup
        await request(httpServer)
          .post('/api/v1/signup')
          .send({
            email: u.email,
            password: u.password,
            username: u.username,
            mbti: u.mbti,
            interests: u.interests,
            lifestyle: u.lifestyle,
          })
          .expect(201);

        // login
        const loginRes = await request(httpServer)
          .post('/api/v1/login')
          .send({ email: u.email, password: u.password })
          .expect(201);

        const token = loginRes.body.token as string;
        userMap[mbti].push({ ...u, token });
      }
    }
  }, 180000); // 초기 세팅은 오래 걸릴 수 있음

  afterAll(async () => {
    await app.close();
  });

  const LENGTH_KEYS: LengthKey[] = ['short', 'medium', 'long', 'very_long'];
  const STYLE_KEYS: StyleKey[] = [
    'emotional',
    'analytical',
    'action',
    'relationship',
  ];

  for (const mbti of MBTIS) {
    describe(`MBTI: ${mbti}`, () => {
      for (const styleKey of STYLE_KEYS) {
        describe(`style: ${styleKey}`, () => {
          for (const lengthKey of LENGTH_KEYS) {
            it(
              `saves diary successfully for style=${styleKey}, length=${lengthKey}`,
              async () => {
                const users = userMap[mbti];
                expect(users && users.length).toBeGreaterThan(0);

                for (const user of users) {
                  const token = user.token;
                  const content = diaries[mbti][styleKey][lengthKey];
                  const diaryDate = new Date().toISOString().slice(0, 10);

                  const payload = {
                    qa: [
                      {
                        domain: 'emotion',
                        question: '오늘 기분은 어땠나요?',
                        answer: content,
                      },
                    ],
                    diaryDate,
                  };

                  const res = await request(httpServer)
                    .post('/api/v1/diaries/save-answers')
                    .set('Authorization', `Bearer ${token}`)
                    .send(payload)
                    .expect(201);

                  expect(res.body.id).toBeDefined();
                  expect(res.body.summary).toBeDefined();
                  expect(Array.isArray(res.body.selectedQuestions)).toBeTruthy();
                }
              },
              60000,
            );
          }
        });
      }
    });
  }
});
