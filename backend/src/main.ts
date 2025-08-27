import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Validation Pipe 설정
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 자동 타입 변환 활성화
    whitelist: true, // DTO에 정의되지 않은 속성 제거
    forbidNonWhitelisted: true, // 허용되지 않은 속성 전달 시 에러
  }));
  
  // CORS 설정
  app.enableCors({
    origin: true, // 또는 origin: true로 모든 도메인 허용
    credentials: true, // 필요시
  });

  // 정적 파일 서빙 설정 (업로드된 파일들을 접근할 수 있도록)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Express static 미들웨어 추가 (추가 보장)
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  await app.listen(3001, '0.0.0.0');
}
bootstrap();
