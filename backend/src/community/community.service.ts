import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async getEntries({ 
    page, 
    emotion, 
    sortBy = 'latest',
    search,
  }: {
    page: number;
    emotion?: string[];
    sortBy?: 'latest' | 'popular' | 'comments';
    search?: string;
  }) {
    const take = 10;
    const skip = (page - 1) * take;

    const where: Prisma.CommunityEntryWhereInput = {
      isPublic: true,
      ...(emotion?.length && {
        emotion: { in: emotion },
      }),
      ...(search && {
        OR: [
          { content: { contains: search, mode: 'insensitive' } },
          { prompt: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.CommunityEntryOrderByWithRelationInput = 
      sortBy === 'popular' ? { likes: 'desc' } :
      sortBy === 'comments' ? { comments: { _count: 'desc' } } :
      { createdAt: 'desc' };

    const [entries, total] = await Promise.all([
      this.prisma.communityEntry.findMany({
        where,
        orderBy,
        take,
        skip,
        include: {
          user: {
            select: {
              username: true,
              profileImage: true, // profile_image -> profileImage
            },
          },
          _count: {
            select: {
              comments: true,
              likedBy: true,
            },
          },
        },
      }),
      this.prisma.communityEntry.count({ where }),
    ]);

    return {
      entries: entries.map(entry => ({
        ...entry,
        comments: entry._count.comments,
        likes: entry._count.likedBy,
      })),
      hasMore: total > skip + take,
    };
  }

  async createEntry(userId: string, createEntryDto: CreateEntryDto) {
    return this.prisma.communityEntry.create({
      data: {
        ...createEntryDto,
        userId,
      },
      include: {
        user: {
          select: {
            username: true,
            profileImage: true, // profile_image -> profileImage
          },
        },
      },
    });
  }

  async toggleLike(userId: string, entryId: number) {
    const existing = await this.prisma.like.findUnique({
      where: {
        userId_entryId: {
          userId,
          entryId,
        },
      },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: {
          userId_entryId: {
            userId,
            entryId,
          },
        },
      });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: {
        userId,
        entryId,
      },
    });
    return { liked: true };
  }

  async addComment(userId: string, entryId: number, content: string) {
    return this.prisma.comment.create({
      data: {
        content,
        userId,
        entryId,
      },
      include: {
        user: {
          select: {
            username: true,
            profileImage: true, // profile_image -> profileImage
          },
        },
      },
    });
  }

  async getComments(entryId: number) {
    return this.prisma.comment.findMany({
      where: { entryId },
      include: {
        user: {
          select: {
            username: true,
            profileImage: true, // profile_image -> profileImage
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}