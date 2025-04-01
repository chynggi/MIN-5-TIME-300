import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Question } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto, authorId: string): Promise<Question> {
    // 사용자 존재 확인
    await this.usersService.findById(authorId);

    try {
      return this.prisma.question.create({
        data: {
          title: createQuestionDto.title,
          content: createQuestionDto.content,
          authorId,
          tags: createQuestionDto.tags || [],
        },
      });
    } catch (error) {
      throw new BadRequestException('질문 생성 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async findAll(page: number, limit: number, search?: string, tags?: string): Promise<Question[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tags) {
      // tags가 쉼표로 구분되어 넘어온다고 가정
      const tagsArray = tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagsArray };
    }
    try {
      return this.prisma.question.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              username: true,
              profileImage: true,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException('질문 조회 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async findOne(id: string): Promise<Question> {
    try {
      const question = await this.prisma.question.findUnique({
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

      if (!question) {
        throw new NotFoundException(`ID가 ${id}인 질문을 찾을 수 없습니다.`);
      }

      return question;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('질문 조회 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto, userId: string): Promise<Question> {
    // 실제 서비스에서는 userId 기반 권한 검증 추가 고려
    try {
      return this.prisma.question.update({
        where: { id },
        data: updateQuestionDto,
      });
    } catch (error) {
      throw new BadRequestException('질문 업데이트 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async remove(id: string, userId: string): Promise<Question> {
    // 실제 서비스에서는 userId 기반 검증 추가 고려
    try {
      return this.prisma.question.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException('질문 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async markAsAnswered(id: string, isAnswered: boolean, userId: string): Promise<Question> {
    // Prisma 스키마에 isAnswered 필드가 없으므로 해당 값을 업데이트하지 않습니다.
    // 만약 해당 기능이 필요 없다면, 별도의 처리를 하거나 에러를 반환하도록 할 수 있습니다.
    throw new BadRequestException('isAnswered 필드는 현재 스키마에서 사용되지 않습니다.');
  }
}