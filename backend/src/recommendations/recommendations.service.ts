import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Recommendation } from './entities/recommendation.entity';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { GetRecommendationsQueryDto } from './dto/get-recommendations-query.dto';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRecommendationDto: CreateRecommendationDto): Promise<Recommendation> {
    return this.prisma.recommendation.create({ data: createRecommendationDto });
  }

  async findAll(query: GetRecommendationsQueryDto): Promise<{ items: Recommendation[]; total: number }> {
    const { userId, type, limit = 10, offset = 0 } = query;
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (type) {
      where.type = type;
    }
    
    const items = await this.prisma.recommendation.findMany({
      where,
      orderBy: { score: 'desc' },
      skip: offset,
      take: limit,
    });
    
    const total = await this.prisma.recommendation.count({ where });
    
    return { items, total };
  }

  async findOne(id: string): Promise<Recommendation> {
    const recommendation = await this.prisma.recommendation.findUnique({ where: { id } });
    if (!recommendation) {
      throw new NotFoundException(`Recommendation with ID "${id}" not found`);
    }
    return recommendation;
  }

  async update(id: string, updateRecommendationDto: UpdateRecommendationDto): Promise<Recommendation> {
    // 확인을 위해 존재하는 엔티티를 먼저 조회합니다.
    await this.findOne(id);
    return this.prisma.recommendation.update({
      where: { id },
      data: updateRecommendationDto,
    });
  }

  async remove(id: string): Promise<void> {
    // 존재 여부 확인 후 삭제합니다.
    await this.findOne(id);
    await this.prisma.recommendation.delete({ where: { id } });
  }

  async getUserRecommendations(userId: string, limit = 10): Promise<Recommendation[]> {
    return this.prisma.recommendation.findMany({
      where: { userId, isSeen: false },
      orderBy: { score: 'desc' },
      take: limit,
    });
  }

  async markAsSeen(id: string): Promise<Recommendation> {
    return this.update(id, { isSeen: true });
  }
}