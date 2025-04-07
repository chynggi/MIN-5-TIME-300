import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Question } from '@prisma/client';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionRepository {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionDto: CreateQuestionDto, authorId: string): Promise<Question> {
    return this.prisma.question.create({
      data: {
        title: createQuestionDto.title,
        content: createQuestionDto.content,
        authorId,
        category: createQuestionDto.category,
        tags: createQuestionDto.tags || [],
      },
    });
  }

  async findAll(
    page: number, 
    limit: number, 
    search?: string, 
    tags?: string,
    category?: number
  ): Promise<{ questions: Question[]; total: number }> {
    const skip = (page - 1) * limit;
    const take = limit;
    const where: any = {};
    
    // 검색 조건
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // 태그 필터링
    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagsArray };
    }
    
    // 카테고리 필터링 - 육하원칙 기반
    if (category !== undefined) {
      where.category = category;
    }
    
    // 질문 및 총 개수 조회
    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.question.count({ where }),
    ]);
    
    return { questions, total };
  }

  async findOne(id: string): Promise<Question> {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto): Promise<Question> {
    return this.prisma.question.update({
      where: { id },
      data: updateQuestionDto,
    });
  }

  async remove(id: string): Promise<Question> {
    return this.prisma.question.delete({
      where: { id },
    });
  }
}