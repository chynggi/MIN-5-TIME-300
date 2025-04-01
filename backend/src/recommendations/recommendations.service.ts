import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { UpdateRecommendationDto } from './dto/update-recommendation.dto';
import { GetRecommendationsQueryDto } from './dto/get-recommendations-query.dto';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Recommendation)
    private readonly recommendationsRepository: Repository<Recommendation>,
  ) {}

  async create(createRecommendationDto: CreateRecommendationDto): Promise<Recommendation> {
    const recommendation = this.recommendationsRepository.create(createRecommendationDto);
    return this.recommendationsRepository.save(recommendation);
  }

  async findAll(query: GetRecommendationsQueryDto): Promise<{ items: Recommendation[]; total: number }> {
    const { userId, type, limit = 10, offset = 0 } = query;
    
    const queryBuilder = this.recommendationsRepository.createQueryBuilder('recommendation');
    
    if (userId) {
      queryBuilder.andWhere('recommendation.userId = :userId', { userId });
    }
    
    if (type) {
      queryBuilder.andWhere('recommendation.type = :type', { type });
    }
    
    queryBuilder.orderBy('recommendation.score', 'DESC');
    queryBuilder.limit(limit);
    queryBuilder.offset(offset);
    
    const [items, total] = await queryBuilder.getManyAndCount();
    
    return { items, total };
  }

  async findOne(id: string): Promise<Recommendation> {
    const recommendation = await this.recommendationsRepository.findOne({ where: { id } });
    if (!recommendation) {
      throw new NotFoundException(`Recommendation with ID "${id}" not found`);
    }
    return recommendation;
  }

  async update(id: string, updateRecommendationDto: UpdateRecommendationDto): Promise<Recommendation> {
    const recommendation = await this.findOne(id);
    Object.assign(recommendation, updateRecommendationDto);
    return this.recommendationsRepository.save(recommendation);
  }

  async remove(id: string): Promise<void> {
    const result = await this.recommendationsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Recommendation with ID "${id}" not found`);
    }
  }

  async getUserRecommendations(userId: string, limit = 10): Promise<Recommendation[]> {
    return this.recommendationsRepository.find({
      where: { userId, isSeen: false },
      order: { score: 'DESC' },
      take: limit,
    });
  }

  async markAsSeen(id: string): Promise<Recommendation> {
    return this.update(id, { isSeen: true });
  }
}