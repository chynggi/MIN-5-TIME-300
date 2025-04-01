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
        tags: createQuestionDto.tags || [],
      },
    });
  }

  async findAll(): Promise<Question[]> {
    return this.prisma.question.findMany({
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