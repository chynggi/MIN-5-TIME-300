import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma.module';
import { PersonaService } from './persona.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileController],
  providers: [ProfileService, PersonaService],
  exports: [ProfileService, PersonaService],
})
export class ProfileModule {}
