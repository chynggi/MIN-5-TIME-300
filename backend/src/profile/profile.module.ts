import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma.module';
import { PersonaService } from './persona.service';
import { StatisticsModule } from '../statistics/statistics.module';
import { FileUploadService } from '../common/services/file-upload.service';

@Module({
  imports: [PrismaModule, StatisticsModule],
  controllers: [ProfileController],
  providers: [ProfileService, PersonaService, FileUploadService],
  exports: [ProfileService, PersonaService],
})
export class ProfileModule {}
