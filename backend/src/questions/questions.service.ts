import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionDto } from './dto/question.dto';
import { Question } from './entities/question.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    private usersService: UsersService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto, userId: string): Promise<QuestionDto> {
    // 사용자 존재 확인
    await this.usersService.findById(userId);

    try {
      const question = this.questionsRepository.create({
        ...createQuestionDto,
        authorId: userId,
        isAnswered: false,
      });
      
      const savedQuestion = await this.questionsRepository.save(question);
      
      return this.mapToDto(savedQuestion);
    } catch (error) {
      throw new BadRequestException('질문 생성 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async findAll(page = 1, limit = 10, search?: string, tags?: string[]): Promise<{ data: QuestionDto[]; total: number; page: number; limit: number }> {
    // 검색 조건 설정
    const where: FindOptionsWhere<Question> = {};
    
    if (search) {
      where.title = Like(`%${search}%`);
    }
    
    if (tags && tags.length > 0) {
      // TypeORM에서 배열 필드 검색을 위한 방법
      // 이 부분은 사용하는 DB에 따라 다를 수 있음
      where.tags = Like(`%${tags.join(',')}%`);
    }
    
    try {
      const [questions, total] = await this.questionsRepository.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['author'] // 관계된 사용자 정보도 가져옴
      });
      
      const data = questions.map(question => this.mapToDto(question));
      
      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new BadRequestException('질문 조회 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async findOne(id: number): Promise<QuestionDto> {
    try {
      const question = await this.questionsRepository.findOne({ 
        where: { id },
        relations: ['author']
      });
      
      if (!question) {
        throw new NotFoundException(`ID가 ${id}인 질문을 찾을 수 없습니다.`);
      }
      
      return this.mapToDto(question);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('질문 조회 중 오류가 발생했습니다: ' + error.message);
    }
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto, userId: string): Promise<QuestionDto> {
    // 트랜잭션 사용
    const queryRunner = this.questionsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const question = await this.questionsRepository.findOne({ 
        where: { id },
        relations: ['author']
      });
      
      if (!question) {
        throw new NotFoundException(`ID가 ${id}인 질문을 찾을 수 없습니다.`);
      }
      
      // 권한 확인 - 작성자만 수정 가능
      if (question.authorId != userId) {
        throw new ForbiddenException('이 질문을 수정할 권한이 없습니다.');
      }
      
      // 객체 병합
      const updatedQuestion = {
        ...question,
        ...updateQuestionDto,
      };
      
      const result = await this.questionsRepository.save(updatedQuestion);
      await queryRunner.commitTransaction();
      
      return this.mapToDto(result);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('질문 업데이트 중 오류가 발생했습니다: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number, userId: string): Promise<void> {
    try {
      const question = await this.questionsRepository.findOne({ 
        where: { id },
        relations: ['author']
      });
      
      if (!question) {
        throw new NotFoundException(`ID가 ${id}인 질문을 찾을 수 없습니다.`);
      }
      
      // 권한 확인 - 작성자만 삭제 가능
      if (question.authorId !== userId) {
        throw new ForbiddenException('이 질문을 삭제할 권한이 없습니다.');
      }
      
      await this.questionsRepository.remove(question);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('질문 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  async markAsAnswered(id: number, isAnswered: boolean, userId: string): Promise<QuestionDto> {
    try {
      const question = await this.questionsRepository.findOne({ 
        where: { id },
        relations: ['author']
      });
      
      if (!question) {
        throw new NotFoundException(`ID가 ${id}인 질문을 찾을 수 없습니다.`);
      }
      
      // 권한 확인 - 작성자만 상태 변경 가능
      if (question.authorId !== userId) {
        throw new ForbiddenException('이 질문의 상태를 변경할 권한이 없습니다.');
      }
      
      question.isAnswered = isAnswered;
      const result = await this.questionsRepository.save(question);
      
      return this.mapToDto(result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('질문 상태 업데이트 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  // 엔티티를 DTO로 변환하는 헬퍼 메서드
  private mapToDto(question: Question): QuestionDto {
    return {
      id: question.id,
      title: question.title,
      content: question.content,
      authorId: question.authorId,
      author: question.author ? {
        id: question.author.id,
        username: question.author.username,
      } : undefined,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      isAnswered: question.isAnswered,
      tags: question.tags
    };
  }
}