import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
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
