/**
 * MIN-5-TIME-300 API 개별 모듈 E2E 테스트
 * 각 API 모듈별 상세 테스트
 */
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import {
  createTestUser,
  signupAndGetToken,
  authRequest,
  formatDate,
  TestUser,
} from './test-utils';

const logger = new Logger('ApiModulesE2E');

describe('API 모듈별 E2E 테스트', () => {
  let app: INestApplication;
  let testUser: TestUser;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // 테스트 사용자 생성
    testUser = await signupAndGetToken(app, createTestUser('module_test'));
    logger.log(`테스트 사용자 생성: ${testUser.email}`);
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== 일기 API 상세 테스트 ====================
  describe('일기 API 상세 테스트', () => {
    let createdDiaryId: string;

    describe('일기 CRUD', () => {
      it('일기 생성 - 텍스트만', async () => {
        const res = await authRequest(app, testUser.token!)
          .post('/api/v1/diaries')
          .field({
            content: '오늘의 일기입니다. 테스트 내용.',
            writingDuration: '20',
            isPublic: 'false',
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('content');
        createdDiaryId = res.body.id;
      });

      it('일기 생성 - 감정 포함', async () => {
        const res = await authRequest(app, testUser.token!)
          .post('/api/v1/diaries')
          .field({
            content: '감정이 포함된 일기입니다.',
            writingDuration: '15',
            emotion: '😊',
            isPublic: 'true',
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
      });

      it('일기 목록 조회', async () => {
        const res = await authRequest(app, testUser.token!)
          .get('/api/v1/diaries')
          .expect(200);

        expect(res.body).toHaveProperty('diaries');
        expect(Array.isArray(res.body.diaries)).toBe(true);
        expect(res.body.diaries.length).toBeGreaterThan(0);
      });

      it('일기 목록 조회 - 페이지네이션', async () => {
        const res = await authRequest(app, testUser.token!)
          .get('/api/v1/diaries?page=1&limit=5')
          .expect(200);

        expect(res.body).toHaveProperty('diaries');
        expect(res.body.diaries.length).toBeLessThanOrEqual(5);
      });

      it('일기 상세 조회', async () => {
        const res = await authRequest(app, testUser.token!)
          .get(`/api/v1/diaries/${createdDiaryId}`)
          .expect(200);

        expect(res.body).toHaveProperty('id', createdDiaryId);
        expect(res.body).toHaveProperty('content');
      });

      it('일기 공개 설정 변경', async () => {
        const res = await authRequest(app, testUser.token!)
          .put(`/api/v1/diaries/${createdDiaryId}/share`)
          .send({ isPublic: true })
          .expect(200);

        expect(res.body).toHaveProperty('isPublic', true);
      });

      it('일기 감정 점수 설정', async () => {
        const res = await authRequest(app, testUser.token!)
          .post(`/api/v1/diaries/${createdDiaryId}/rate`)
          .send({ emotionScore: 8 })
          .expect(201);

        expect(res.body).toHaveProperty('emotionScore', 8);
      });

      it('일기 삭제', async () => {
        const res = await authRequest(app, testUser.token!)
          .delete(`/api/v1/diaries/${createdDiaryId}`)
          .expect(200);

        expect(res.body).toHaveProperty('deleted', true);
      });
    });

    describe('질문 기반 일기', () => {
      it('질문 답변 저장', async () => {
        const diaryDate = formatDate();
        const res = await authRequest(app, testUser.token!)
          .post('/api/v1/diaries/save-answers')
          .send({
            qa: [
              { domain: 'emotion', question: '오늘 기분은?', answer: '좋았어요' },
              { domain: 'action', question: '오늘 한 일은?', answer: '코딩' },
            ],
            diaryDate,
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('selectedQuestions');
      });
    });
  });

  // ==================== 프로필 API 상세 테스트 ====================
  describe('프로필 API 상세 테스트', () => {
    it('프로필 조회', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/profile')
        .expect(200);

      expect(res.body).toHaveProperty('id', testUser.id);
      expect(res.body).toHaveProperty('email', testUser.email);
    });

    it('프로필 수정', async () => {
      const res = await authRequest(app, testUser.token!)
        .put('/api/v1/profile')
        .send({ bio: '새로운 자기소개입니다.' })
        .expect(200);

      expect(res.body).toHaveProperty('bio', '새로운 자기소개입니다.');
    });

    it('관심사 설정', async () => {
      const res = await authRequest(app, testUser.token!)
        .post('/api/v1/profile/interests')
        .send({ interests: ['프로그래밍', '음악', '여행'] })
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
    });
  });

  // ==================== 통계 API 상세 테스트 ====================
  describe('통계 API 상세 테스트', () => {
    it('대시보드 통계 조회', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/statistics/dashboard')
        .expect(200);

      expect(res.body).toHaveProperty('writingStreak');
      expect(res.body).toHaveProperty('totalEntries');
      expect(res.body).toHaveProperty('averageEmotionScore');
    });

    it('대시보드 통계 조회 - 기간별', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/statistics/dashboard?period=week')
        .expect(200);

      expect(res.body).toHaveProperty('writingStreak');
    });

    it('LPG 점수 조회', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/statistics/lpg-score')
        .expect(200);

      expect(res.body).toHaveProperty('lpgScore');
      expect(res.body).toHaveProperty('grade');
    });
  });

  // ==================== 체크인 API 상세 테스트 ====================
  describe('체크인 API 상세 테스트', () => {
    it('오늘 체크인 상태 확인', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/checkin/today')
        .expect(200);

      expect(res.body).toHaveProperty('exists');
      expect(res.body).toHaveProperty('percent');
    });

    it('체크인 생성', async () => {
      const diaryDate = formatDate();
      const res = await authRequest(app, testUser.token!)
        .post('/api/v1/checkin')
        .send({
          diaryDate,
          mood_1to10: 7,
          energy_1to10: 6,
          stress_1to10: 4,
          sleep_hours_1to9p: 7,
          sleep_quality_1to10: 8,
          activity_types: ['운동'],
          workout_intensity_1to10: 5,
          focus_1to10: 7,
          fatigue_1to10: 3,
          social_count_1to10: 5,
          social_satisfaction_1to10: 7,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('percent');
    });
  });

  // ==================== 채팅 API 상세 테스트 ====================
  describe('채팅 API 상세 테스트', () => {
    it('채팅방 목록 조회', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/chat_rooms')
        .expect(200);

      expect(res.body).toHaveProperty('chatRooms');
      expect(Array.isArray(res.body.chatRooms)).toBe(true);
    });

    it('대화 목록 조회', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/chat/conversations')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ==================== 친구 API 상세 테스트 ====================
  describe('친구 API 상세 테스트', () => {
    it('친구 목록 조회', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/friends')
        .expect(200);

      expect(res.body).toHaveProperty('friends');
      expect(Array.isArray(res.body.friends)).toBe(true);
    });

    it('사용자 검색', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/friends/search?query=test')
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  // ==================== 커뮤니티 API 상세 테스트 ====================
  describe('커뮤니티 API 상세 테스트', () => {
    it('공개 일기 목록 조회', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/communities/diaries')
        .expect(200);

      expect(res.body).toHaveProperty('diaries');
      expect(Array.isArray(res.body.diaries)).toBe(true);
    });
  });

  // ==================== 알림 API 상세 테스트 ====================
  describe('알림 API 상세 테스트', () => {
    it('알림 설정 조회', async () => {
      const res = await authRequest(app, testUser.token!)
        .get('/api/v1/notifications/preferences')
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('알림 설정 업데이트', async () => {
      const res = await authRequest(app, testUser.token!)
        .put('/api/v1/notifications/preferences')
        .send({ channelInApp: true })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // ==================== 질문 생성 API 테스트 ====================
  describe('질문 생성 API 테스트', () => {
    it('질문 생성', async () => {
      const res = await authRequest(app, testUser.token!)
        .post('/api/v1/questions/generate')
        .expect(201);

      expect(res.body).toBeDefined();
      // 질문이 있으면 확인
      if (res.body.question) {
        expect(typeof res.body.question).toBe('string');
      }
      if (res.body.questions) {
        expect(Array.isArray(res.body.questions)).toBe(true);
      }
    });
  });
});
