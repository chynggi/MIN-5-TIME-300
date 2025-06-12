import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class Community2Service {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicDiaries(req: any, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const [diaries, totalCount] = await Promise.all([
      this.prisma.publicDiary.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: {},
      }),
      this.prisma.publicDiary.count(),
    ]);
    return { diaries, totalCount, page, limit };
  }

  async createPublicDiary(req: any, dto: any) {
    const userId = req.user.userId;
    const created = await this.prisma.publicDiary.create({
      data: {
        content: dto.content,
        userId,
        isPublic: true,
        writingDuration: dto.writingDuration || 1,
      },
    });
    return { id: created.id };
  }

  async getPublicDiary(req: any, id: string) {
    const diary = await this.prisma.publicDiary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('공개 일기를 찾을 수 없습니다.');
    return diary;
  }

  async updatePublicDiary(req: any, id: string, dto: any) {
    const userId = req.user.userId;
    const diary = await this.prisma.publicDiary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('공개 일기를 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('수정 권한이 없습니다.');
    await this.prisma.publicDiary.update({
      where: { id },
      data: { content: dto.content },
    });
    return { success: true };
  }

  async deletePublicDiary(req: any, id: string) {
    const userId = req.user.userId;
    const diary = await this.prisma.publicDiary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('공개 일기를 찾을 수 없습니다.');
    if (diary.userId !== userId) throw new ForbiddenException('삭제 권한이 없습니다.');
    await this.prisma.publicDiary.delete({ where: { id } });
    return { success: true };
  }
}
