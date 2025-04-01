import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@Injectable()
export class DiariesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDiaryDto: CreateDiaryDto) {
    // 태그 처리를 위한 로직
    const { tags, ...diaryData } = createDiaryDto;
    // Ensure that 'title' always has a value even if undefined in diaryData
    const diaryDataWithDefaults = { title: diaryData.title || "", ...diaryData };

    // 일기 생성 (태그 연결 포함)
    const diary = await this.prisma.diary.create({
      data: {
        ...diaryDataWithDefaults,
        user: {
          connect: { id: userId }  // userId 직접 할당 대신 관계 연결
        },
        tags: tags?.length 
          ? {
              create: tags.map(name => ({
                tag: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
            } 
          : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return diary;
  }

  async findAll(cursor?: string, limit = 10) {
    // 커서 기반 페이지네이션
    const diaries = await this.prisma.diary.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return diaries;
  }
  
  async findUserEntries(userId: string) {
    return this.prisma.diary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }
  
  async findSharedEntries(cursor?: string, limit = 10, excludeUserId?: string) {
    // 공개된 일기만 조회 (자신의 일기 제외 가능)
    const diaries = await this.prisma.diary.findMany({
      where: {
        isPrivate: false,
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return diaries;
  }

  async findOne(id: number, userId?: string) {
    const diary = await this.prisma.diary.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!diary) {
      throw new NotFoundException('일기를 찾을 수 없습니다');
    }

    // 비공개 일기는 작성자만 볼 수 있음
    if (diary.isPrivate && diary.userId !== userId) {
      throw new ForbiddenException('이 일기에 접근할 권한이 없습니다');
    }

    return diary;
  }

  async update(id: number, userId: string, updateDiaryDto: UpdateDiaryDto) {
    // 일기 존재 및 권한 확인
    const diary = await this.prisma.diary.findUnique({
      where: { id },
    });

    if (!diary) {
      throw new NotFoundException('일기를 찾을 수 없습니다');
    }

    if (diary.userId !== userId) {
      throw new ForbiddenException('이 일기를 수정할 권한이 없습니다');
    }

    // 태그 처리를 위한 로직
    const { tags, ...diaryData } = updateDiaryDto;

    // 일기 업데이트
    if (tags) {
      // 기존 태그 연결 삭제
      await this.prisma.diaryTag.deleteMany({
        where: { diaryId: id },
      });

      // 새 태그 연결
      for (const tagName of tags) {
        const tag = await this.prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await this.prisma.diaryTag.create({
          data: {
            diaryId: id,
            tagId: tag.id,
          },
        });
      }
    }

    // 일기 정보 업데이트
    const updatedDiary = await this.prisma.diary.update({
      where: { id },
      data: diaryData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return updatedDiary;
  }

  async remove(id: number, userId: string) {
    // 일기 존재 및 권한 확인
    const diary = await this.prisma.diary.findUnique({
      where: { id },
    });

    if (!diary) {
      throw new NotFoundException('일기를 찾을 수 없습니다');
    }

    if (diary.userId !== userId) {
      throw new ForbiddenException('이 일기를 삭제할 권한이 없습니다');
    }

    // 관련 태그 연결 삭제
    await this.prisma.diaryTag.deleteMany({
      where: { diaryId: id },
    });

    // 일기 삭제
    return this.prisma.diary.delete({
      where: { id },
    });
  }
}