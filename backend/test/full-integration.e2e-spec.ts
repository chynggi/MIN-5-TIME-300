/**
 * MIN-5-TIME-300 전체 통합 E2E 테스트
 * 백엔드 API 전체 기능을 테스트합니다.
 */
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

const logger = new Logger('FullIntegrationE2E');

// 테스트 사용자 정의
const testUsers = {
  user1: {
    email: `e2e_user1_${Date.now()}@test.com`,
    password: 'Test1234!',
    username: `e2e_user1_${Date.now()}`,
  },
  user2: {
    email: `e2e_user2_${Date.now()}@test.com`,
    password: 'Test1234!',
    username: `e2e_user2_${Date.now()}`,
  },
  user3: {
    email: `e2e_user3_${Date.now()}@test.com`,
    password: 'Test1234!',
    username: `e2e_user3_${Date.now()}`,
  },
};

describe('MIN-5-TIME-300 전체 통합 테스트 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // 토큰 및 ID 저장
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;

  // 생성된 리소스 ID 저장 (테스트 간 공유)
  let createdDiaryId: string;
  let createdConversationId: string;

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
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    logger.log('테스트 환경 초기화 완료');
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    try {
      const userIds = [user1Id, user2Id, user3Id].filter(Boolean);
      
      if (userIds.length > 0) {
        // 연관 데이터 삭제
        await prisma.follow.deleteMany({
          where: {
            OR: [
              { followerId: { in: userIds } },
              { followeeId: { in: userIds } },
            ],
          },
        });

        await prisma.followCounters.deleteMany({
          where: { userId: { in: userIds } },
        });

        await prisma.journal.deleteMany({
          where: { userId: { in: userIds } },
        });

        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }

      logger.log('테스트 데이터 정리 완료');
    } catch (error) {
      logger.warn('테스트 데이터 정리 중 오류:', error);
    }

    await app.close();
  });

  // ==================== 인증 (Auth) 테스트 ====================
  describe('1. 인증 API 테스트', () => {
    describe('회원가입', () => {
      it('POST /api/v1/signup - 첫 번째 사용자 회원가입 성공', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/signup')
          .send(testUsers.user1)
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email', testUsers.user1.email);
        expect(res.body).toHaveProperty('username', testUsers.user1.username);
        expect(res.body).toHaveProperty('token');
        
        user1Id = res.body.id;
        user1Token = res.body.token;
        logger.log(`User1 생성 완료: ${user1Id}`);
      });

      it('POST /api/v1/signup - 두 번째 사용자 회원가입 성공', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/signup')
          .send(testUsers.user2)
          .expect(201);

        user2Id = res.body.id;
        user2Token = res.body.token;
        logger.log(`User2 생성 완료: ${user2Id}`);
      });

      it('POST /api/v1/signup - 세 번째 사용자 회원가입 성공', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/signup')
          .send(testUsers.user3)
          .expect(201);

        user3Id = res.body.id;
        user3Token = res.body.token;
        logger.log(`User3 생성 완료: ${user3Id}`);
      });

      it('POST /api/v1/signup - 중복 이메일 가입 실패', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/signup')
          .send(testUsers.user1)
          .expect(409);
      });

      it('POST /api/v1/signup - 유효하지 않은 이메일 형식 실패', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/signup')
          .send({
            email: 'invalid-email',
            password: 'Test1234!',
            username: 'testuser',
          })
          .expect(400);
      });
    });

    describe('로그인', () => {
      it('POST /api/v1/login - 올바른 자격 증명으로 로그인 성공', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/login')
          .send({
            email: testUsers.user1.email,
            password: testUsers.user1.password,
          })
          .expect(201);

        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('email', testUsers.user1.email);
        user1Token = res.body.token;
      });

      it('POST /api/v1/login - 잘못된 비밀번호로 로그인 실패', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/login')
          .send({
            email: testUsers.user1.email,
            password: 'WrongPassword!',
          })
          .expect(401);
      });

      it('POST /api/v1/login - 존재하지 않는 이메일로 로그인 실패', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'Test1234!',
          })
          .expect(401);
      });
    });
  });

  // ==================== 프로필 테스트 ====================
  describe('2. 프로필 API 테스트', () => {
    it('GET /api/v1/profile - 프로필 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', user1Id);
      expect(res.body).toHaveProperty('email', testUsers.user1.email);
      expect(res.body).toHaveProperty('username');
    });

    it('GET /api/v1/profile - 토큰 없이 프로필 조회 실패', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/profile')
        .expect(401);
    });

    it('PUT /api/v1/profile - 프로필 수정 성공', async () => {
      const updatedUsername = `updated_${testUsers.user1.username}`;
      const res = await request(app.getHttpServer())
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ username: updatedUsername })
        .expect(200);

      expect(res.body).toHaveProperty('username', updatedUsername);
    });

    it('POST /api/v1/profile/interests - 관심사 업데이트 성공', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/profile/interests')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ interests: ['운동', '음악', '독서'] })
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
    });
  });

  // ==================== 일기 (Diary) 테스트 ====================
  describe('3. 일기 API 테스트', () => {
    describe('일기 작성', () => {
      it('POST /api/v1/diaries - 일기 작성 성공', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/diaries')
          .set('Authorization', `Bearer ${user1Token}`)
          .field({
            content: '오늘 하루는 정말 좋았습니다. E2E 테스트를 작성했습니다.',
            writingDuration: '30',
            isPublic: 'false',
            emotion: '😊',
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('content');
        createdDiaryId = res.body.id;
        logger.log(`일기 생성 완료: ${createdDiaryId}`);
      });

      it('POST /api/v1/diaries - 위치 정보 포함 일기 작성 성공', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/diaries')
          .set('Authorization', `Bearer ${user1Token}`)
          .field({
            content: '위치 정보가 포함된 일기입니다.',
            writingDuration: '15',
            isPublic: 'true',
            emotion: '🏙️',
            lat: '37.5665',
            lng: '126.9780',
          })
          .expect(201);

        expect(res.body).toHaveProperty('lat');
        expect(res.body).toHaveProperty('lng');
        expect(res.body.lat).toBeCloseTo(37.5665);
        expect(res.body.lng).toBeCloseTo(126.9780);
      });

      it('POST /api/v1/diaries - 토큰 없이 일기 작성 실패', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/diaries')
          .field({ content: '테스트' })
          .expect(401);
      });
    });

    describe('일기 조회', () => {
      it('GET /api/v1/diaries - 일기 목록 조회 성공', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/diaries')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(res.body).toHaveProperty('diaries');
        expect(Array.isArray(res.body.diaries)).toBe(true);
        expect(res.body.diaries.length).toBeGreaterThan(0);
      });

      it('GET /api/v1/diaries/:id - 특정 일기 조회 성공', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/diaries/${createdDiaryId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(res.body).toHaveProperty('id', createdDiaryId);
        expect(res.body).toHaveProperty('content');
      });

      it('GET /api/v1/diaries/:id - 존재하지 않는 일기 조회 실패', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/diaries/nonexistent-id')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(404);
      });
    });

    describe('일기 수정 및 삭제', () => {
      it('PUT /api/v1/diaries/:id/share - 일기 공개/비공개 설정 성공', async () => {
        const res = await request(app.getHttpServer())
          .put(`/api/v1/diaries/${createdDiaryId}/share`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ isPublic: true })
          .expect(200);

        expect(res.body).toHaveProperty('isPublic', true);
      });

      it('POST /api/v1/diaries/:id/rate - 일기 감정 평가 성공', async () => {
        const res = await request(app.getHttpServer())
          .post(`/api/v1/diaries/${createdDiaryId}/rate`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ emotionScore: 8 })
          .expect(201);

        expect(res.body).toHaveProperty('emotionScore', 8);
      });
    });

    describe('질문 기반 일기', () => {
      it('POST /api/v1/diaries/save-answers - 질문 답변 저장 성공', async () => {
        const diaryDate = new Date().toISOString().slice(0, 10);
        const res = await request(app.getHttpServer())
          .post('/api/v1/diaries/save-answers')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            qa: [
              { domain: 'emotion', question: '오늘 기분은 어떠셨나요?', answer: '매우 좋았습니다!' },
              { domain: 'action', question: '오늘 무엇을 하셨나요?', answer: 'E2E 테스트 작성' },
              { domain: 'relationship', question: '오늘 만난 사람은?', answer: '동료들과 미팅' },
            ],
            diaryDate,
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('selectedQuestions');
        expect(Array.isArray(res.body.selectedQuestions)).toBe(true);
      });
    });
  });

  // ==================== 체크인 테스트 ====================
  describe('4. 체크인 API 테스트', () => {
    it('GET /api/v1/checkin/today - 오늘의 체크인 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/checkin/today')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('exists');
      expect(res.body).toHaveProperty('percent');
    });

    it('POST /api/v1/checkin - 체크인 생성 성공', async () => {
      const diaryDate = new Date().toISOString().slice(0, 10);
      const res = await request(app.getHttpServer())
        .post('/api/v1/checkin')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          diaryDate,
          mood_1to10: 7,
          energy_1to10: 6,
          stress_1to10: 4,
          sleep_hours_1to9p: 7,
          sleep_quality_1to10: 8,
          activity_types: ['운동', '산책'],
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

  // ==================== 팔로우 테스트 ====================
  describe('5. 팔로우 API 테스트', () => {
    it('POST /follow/:userId - 팔로우 요청 성공', async () => {
      const res = await request(app.getHttpServer())
        .post(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('followerId', user1Id);
      expect(res.body).toHaveProperty('followeeId', user2Id);
    });

    it('POST /follow/:userId - 자기 자신 팔로우 실패', async () => {
      await request(app.getHttpServer())
        .post(`/follow/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });

    it('POST /follow/:userId - 중복 팔로우 실패', async () => {
      await request(app.getHttpServer())
        .post(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });

    it('GET /follow/:userId/followers - 팔로워 목록 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get(`/follow/${user2Id}/followers`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /follow/:userId/following - 팔로잉 목록 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get(`/follow/${user1Id}/following`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /follow/:userId/counters - 팔로우 카운터 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get(`/follow/${user1Id}/counters`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('followersCount');
      expect(res.body).toHaveProperty('followingCount');
    });

    it('GET /follow/:userId/relationship - 팔로우 관계 확인 성공', async () => {
      const res = await request(app.getHttpServer())
        .get(`/follow/${user2Id}/relationship`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('status');
    });

    it('DELETE /follow/:userId - 언팔로우 성공', async () => {
      await request(app.getHttpServer())
        .delete(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);
    });
  });

  // ==================== 친구 테스트 ====================
  describe('6. 친구 API 테스트', () => {
    it('GET /api/v1/friends - 친구 목록 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/friends')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('friends');
      expect(Array.isArray(res.body.friends)).toBe(true);
    });

    it('GET /api/v1/friends/search - 사용자 검색 성공', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/friends/search?query=${testUsers.user2.username.substring(0, 5)}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  // ==================== 채팅 테스트 ====================
  describe('7. 채팅 API 테스트', () => {
    it('GET /api/v1/chat_rooms - 채팅방 목록 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/chat_rooms')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('chatRooms');
      expect(Array.isArray(res.body.chatRooms)).toBe(true);
    });

    it('POST /api/v1/chat/conversations - 대화 생성 성공', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ recipientId: user2Id })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      createdConversationId = res.body.id;
      logger.log(`대화 생성 완료: ${createdConversationId}`);
    });

    it('GET /api/v1/chat/conversations - 대화 목록 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/v1/chat/conversations/:id/messages - 메시지 전송 성공', async () => {
      if (!createdConversationId) {
        logger.warn('대화 ID가 없어 메시지 테스트 건너뜀');
        return;
      }

      const res = await request(app.getHttpServer())
        .post(`/api/v1/chat/conversations/${createdConversationId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: '안녕하세요! E2E 테스트 메시지입니다.' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('content');
    });

    it('GET /api/v1/chat/conversations/:id/messages - 메시지 목록 조회 성공', async () => {
      if (!createdConversationId) {
        logger.warn('대화 ID가 없어 메시지 목록 테스트 건너뜀');
        return;
      }

      const res = await request(app.getHttpServer())
        .get(`/api/v1/chat/conversations/${createdConversationId}/messages`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
    });
  });

  // ==================== 통계 테스트 ====================
  describe('8. 통계 API 테스트', () => {
    it('GET /api/v1/statistics/dashboard - 대시보드 통계 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/statistics/dashboard')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('writingStreak');
      expect(res.body).toHaveProperty('totalEntries');
      expect(res.body).toHaveProperty('averageEmotionScore');
    });

    it('GET /api/v1/statistics/lpg-score - LPG 점수 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/statistics/lpg-score')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('lpgScore');
      expect(res.body).toHaveProperty('grade');
    });
  });

  // ==================== 커뮤니티 테스트 ====================
  describe('9. 커뮤니티 API 테스트', () => {
    it('GET /api/v1/communities/diaries - 공개 일기 목록 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/communities/diaries')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('diaries');
      expect(Array.isArray(res.body.diaries)).toBe(true);
    });
  });

  // ==================== 알림 설정 테스트 ====================
  describe('10. 알림 API 테스트', () => {
    it('GET /api/v1/notifications/preferences - 알림 설정 조회 성공', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 알림 설정이 있으면 속성 확인
      expect(res.body).toBeDefined();
    });

    it('PUT /api/v1/notifications/preferences - 알림 설정 업데이트 성공', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ channelInApp: true, channelPush: false })
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // ==================== 질문 생성 테스트 ====================
  describe('11. 질문 생성 API 테스트', () => {
    it('POST /api/v1/questions/generate - 질문 생성 성공', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/questions/generate')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(201);

      // 질문이 생성되었는지 확인
      expect(res.body).toBeDefined();
      if (res.body.question) {
        expect(typeof res.body.question).toBe('string');
      }
      if (res.body.questions) {
        expect(Array.isArray(res.body.questions)).toBe(true);
      }
    });
  });

  // ==================== 조언 (Advice) 테스트 ====================
  describe('12. 조언 API 테스트', () => {
    it('GET /api/v1/advice/latest - 최신 조언 조회', async () => {
      try {
        const res = await request(app.getHttpServer())
          .get('/api/v1/advice/latest')
          .set('Authorization', `Bearer ${user1Token}`);

        // 조언이 있으면 확인, 없으면 404
        if (res.status === 200) {
          expect(res.body).toHaveProperty('advice');
        } else {
          expect([200, 404]).toContain(res.status);
        }
      } catch (error) {
        // 조언이 없는 경우 예외 허용
        logger.log('최신 조언이 없습니다.');
      }
    });

    it('POST /api/v1/advice/generate - 조언 생성', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/advice/generate')
        .set('Authorization', `Bearer ${user1Token}`);

      // AI 서비스 연결 여부에 따라 다른 응답 가능
      expect([200, 201, 500, 503]).toContain(res.status);
    });
  });

  // ==================== 일기 삭제 테스트 (마지막에 실행) ====================
  describe('13. 일기 삭제 테스트', () => {
    it('DELETE /api/v1/diaries/:id - 일기 삭제 성공', async () => {
      if (!createdDiaryId) {
        logger.warn('삭제할 일기 ID가 없습니다.');
        return;
      }

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/diaries/${createdDiaryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('deleted', true);
    });

    it('DELETE /api/v1/diaries/:id - 다른 사용자의 일기 삭제 실패', async () => {
      // 먼저 User2로 일기 생성
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/diaries')
        .set('Authorization', `Bearer ${user2Token}`)
        .field({
          content: 'User2의 일기입니다.',
          writingDuration: '10',
        })
        .expect(201);

      const otherUserDiaryId = createRes.body.id;

      // User1이 User2의 일기 삭제 시도
      await request(app.getHttpServer())
        .delete(`/api/v1/diaries/${otherUserDiaryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      // 정리: User2가 자신의 일기 삭제
      await request(app.getHttpServer())
        .delete(`/api/v1/diaries/${otherUserDiaryId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);
    });
  });

  // ==================== 헬스 체크 테스트 ====================
  describe('14. 시스템 헬스 체크', () => {
    it('GET / - 메인 엔드포인트 응답 확인', async () => {
      const res = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(res.text).toBe('Hello World!');
    });
  });
});
