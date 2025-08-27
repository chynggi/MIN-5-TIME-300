import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Follow System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // 테스트용 사용자 토큰
  let user1Token: string;
  let user2Token: string;
  let user3Token: string; // 비공개 계정
  
  // 테스트용 사용자 ID
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    await app.init();

    // 테스트용 사용자 생성
    const user1 = await prisma.user.create({
      data: {
        email: 'follow-test1@test.com',
        passwordHash: 'hashed_password',
        username: 'followUser1',
        isPrivate: false,
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'follow-test2@test.com',
        passwordHash: 'hashed_password',
        username: 'followUser2',
        isPrivate: false,
      },
    });

    const user3 = await prisma.user.create({
      data: {
        email: 'follow-test3@test.com',
        passwordHash: 'hashed_password',
        username: 'followUser3',
        isPrivate: true, // 비공개 계정
      },
    });

    user1Id = user1.id;
    user2Id = user2.id;
    user3Id = user3.id;

    // JWT 토큰 생성
    user1Token = jwtService.sign({ sub: user1Id, email: user1.email });
    user2Token = jwtService.sign({ sub: user2Id, email: user2.email });
    user3Token = jwtService.sign({ sub: user3Id, email: user3.email });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: [user1Id, user2Id, user3Id] } },
          { followeeId: { in: [user1Id, user2Id, user3Id] } },
        ],
      },
    });

    await prisma.followCounters.deleteMany({
      where: {
        userId: { in: [user1Id, user2Id, user3Id] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [user1Id, user2Id, user3Id] },
      },
    });

    await app.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 팔로우 관계 정리
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: [user1Id, user2Id, user3Id] } },
          { followeeId: { in: [user1Id, user2Id, user3Id] } },
        ],
      },
    });

    await prisma.followCounters.deleteMany({
      where: {
        userId: { in: [user1Id, user2Id, user3Id] },
      },
    });
  });

  describe('팔로우 기본 기능', () => {
    it('공개 계정을 팔로우할 수 있어야 합니다', async () => {
      const response = await request(app.getHttpServer())
        .post(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.followerId).toBe(user1Id);
      expect(response.body.followeeId).toBe(user2Id);
    });

    it('비공개 계정에 팔로우 요청을 보낼 수 있어야 합니다', async () => {
      const response = await request(app.getHttpServer())
        .post(`/follow/${user3Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.status).toBe('REQUESTED');
      expect(response.body.followerId).toBe(user1Id);
      expect(response.body.followeeId).toBe(user3Id);
    });

    it('자기 자신을 팔로우할 수 없어야 합니다', async () => {
      await request(app.getHttpServer())
        .post(`/follow/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });

    it('이미 팔로우 중인 사용자를 다시 팔로우할 수 없어야 합니다', async () => {
      // 첫 번째 팔로우
      await request(app.getHttpServer())
        .post(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 두 번째 팔로우 시도
      await request(app.getHttpServer())
        .post(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });
  });

  describe('언팔로우 기능', () => {
    it('팔로우를 해제할 수 있어야 합니다', async () => {
      // 먼저 팔로우
      await request(app.getHttpServer())
        .post(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 언팔로우
      await request(app.getHttpServer())
        .delete(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(204);
    });

    it('팔로우하지 않은 사용자를 언팔로우할 수 없어야 합니다', async () => {
      await request(app.getHttpServer())
        .delete(`/follow/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });
  });

  describe('팔로우 요청 승인/거절', () => {
    it('비공개 계정 소유자가 팔로우 요청을 승인할 수 있어야 합니다', async () => {
      // 팔로우 요청 보내기
      await request(app.getHttpServer())
        .post(`/follow/${user3Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 요청 승인
      const response = await request(app.getHttpServer())
        .post(`/follow/${user1Id}/approve`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });

    it('비공개 계정 소유자가 팔로우 요청을 거절할 수 있어야 합니다', async () => {
      // 팔로우 요청 보내기
      await request(app.getHttpServer())
        .post(`/follow/${user3Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 요청 거절
      await request(app.getHttpServer())
        .post(`/follow/${user1Id}/reject`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(204);
    });

    it('존재하지 않는 팔로우 요청을 승인할 수 없어야 합니다', async () => {
      await request(app.getHttpServer())
        .post(`/follow/${user1Id}/approve`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(400);
    });
  });

  describe('팔로우 목록 조회', () => {
    beforeEach(async () => {
      // 테스트 데이터 설정: user2가 user1을 팔로우
      await prisma.follow.create({
        data: {
          followerId: user2Id,
          followeeId: user1Id,
          status: 'ACTIVE',
        },
      });

      // 카운터 업데이트
      await prisma.followCounters.create({
        data: {
          userId: user1Id,
          followersCount: 1,
          followingCount: 0,
        },
      });

      await prisma.followCounters.create({
        data: {
          userId: user2Id,
          followersCount: 0,
          followingCount: 1,
        },
      });
    });

    it('팔로워 목록을 조회할 수 있어야 합니다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/follow/${user1Id}/followers`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].followerId).toBe(user2Id);
      expect(response.body.data[0].followeeId).toBe(user1Id);
      expect(response.body.data[0].follower).toBeDefined();
    });

    it('팔로잉 목록을 조회할 수 있어야 합니다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/follow/${user2Id}/following`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].followerId).toBe(user2Id);
      expect(response.body.data[0].followeeId).toBe(user1Id);
      expect(response.body.data[0].followee).toBeDefined();
    });

    it('팔로우 요청 목록을 조회할 수 있어야 합니다', async () => {
      // 팔로우 요청 생성
      await prisma.follow.create({
        data: {
          followerId: user1Id,
          followeeId: user3Id,
          status: 'REQUESTED',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/follow/requests')
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('REQUESTED');
    });
  });

  describe('팔로우 카운터', () => {
    it('팔로우 카운터를 조회할 수 있어야 합니다', async () => {
      // 카운터 생성
      await prisma.followCounters.create({
        data: {
          userId: user1Id,
          followersCount: 5,
          followingCount: 3,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/follow/${user1Id}/counters`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.followersCount).toBe(5);
      expect(response.body.followingCount).toBe(3);
    });

    it('카운터가 없는 경우 실시간으로 계산해서 반환해야 합니다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/follow/${user1Id}/counters`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.followersCount).toBe(0);
      expect(response.body.followingCount).toBe(0);
    });
  });

  describe('팔로우 관계 확인', () => {
    it('팔로우 관계를 확인할 수 있어야 합니다', async () => {
      // 팔로우 관계 생성
      await prisma.follow.create({
        data: {
          followerId: user1Id,
          followeeId: user2Id,
          status: 'ACTIVE',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/follow/${user2Id}/relationship`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.status).toBe('active');
    });

    it('팔로우 관계가 없는 경우 none을 반환해야 합니다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/follow/${user2Id}/relationship`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.status).toBe('none');
    });
  });

  describe('페이지네이션', () => {
    beforeEach(async () => {
      // 여러 팔로우 관계 생성
      for (let i = 0; i < 25; i++) {
        const testUser = await prisma.user.create({
          data: {
            email: `pagination-test-${i}@test.com`,
            passwordHash: 'hashed_password',
            username: `paginationUser${i}`,
            isPrivate: false,
          },
        });

        await prisma.follow.create({
          data: {
            followerId: testUser.id,
            followeeId: user1Id,
            status: 'ACTIVE',
          },
        });
      }
    });

    it('팔로워 목록을 페이지네이션으로 조회할 수 있어야 합니다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/follow/${user1Id}/followers?limit=10`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.hasMore).toBe(true);
      expect(response.body.nextCursor).toBeDefined();
    });

    afterEach(async () => {
      // 테스트 사용자들 정리
      await prisma.follow.deleteMany({
        where: {
          followeeId: user1Id,
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: { startsWith: 'pagination-test-' },
        },
      });
    });
  });
});