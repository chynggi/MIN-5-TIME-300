import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { UsersService } from '../users/users.service';
import { Question } from '@prisma/client';
import { QuestionRepository } from './question.repository';
import { getAllCategories, getCategoryInfo } from './helpers/category-helper';

@Injectable()
export class QuestionsService {
  constructor(
    private questionRepository: QuestionRepository,
    private usersService: UsersService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto, authorId: string): Promise<Question> {
    // 사용자 존재 확인
    await this.usersService.findById(authorId);

    try {
      // 리포지토리를 통해 질문 생성
      return this.questionRepository.create(createQuestionDto, authorId);
    } catch (error) {
      throw new BadRequestException('질문 생성 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async findAll(page: number, limit: number, search?: string, tags?: string, category?: number) {
    try {
      const result = await this.questionRepository.findAll(page, limit, search, tags, category);
      return {
        questions: result.questions,
        total: result.total,
        categories: getAllCategories(),
      };
    } catch (error) {
      throw new BadRequestException('질문 조회 중 오류가 발생했습니다.');
    }
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne(id);
    
    if (!question) {
      throw new NotFoundException(`ID가 ${id}인 질문을 찾을 수 없습니다.`);
    }
    
    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto, userId: string): Promise<Question> {
    // 질문이 있는지 확인
    const question = await this.findOne(id);
    
    // 소유권 확인
    if (question.authorId !== userId) {
      throw new ForbiddenException('이 질문을 수정할 권한이 없습니다.');
    }
    
    return this.questionRepository.update(id, updateQuestionDto);
  }

  async remove(id: string, userId: string): Promise<Question> {
    // 질문이 있는지 확인
    const question = await this.findOne(id);
    
    // 소유권 확인
    if (question.authorId !== userId) {
      throw new ForbiddenException('이 질문을 삭제할 권한이 없습니다.');
    }
    
    return this.questionRepository.remove(id);
  }

  async markAsAnswered(id: string, isAnswered: boolean, userId: string): Promise<Question> {
    // Prisma 스키마에 isAnswered 필드가 없으므로 해당 값을 업데이트하지 않습니다.
    // 만약 해당 기능이 필요 없다면, 별도의 처리를 하거나 에러를 반환하도록 할 수 있습니다.
    throw new BadRequestException('isAnswered 필드는 현재 스키마에서 사용되지 않습니다.');
  }

  // 카테고리 목록 조회 기능 추가
  async getCategories() {
    return getAllCategories();
  }
}