import { Module } from '@nestjs/common';
import { Community2Controller } from './community2.controller';
import { Community2Service } from './community2.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [Community2Controller],
  providers: [Community2Service],
})
export class Community2Module {}
