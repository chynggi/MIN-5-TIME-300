import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Validation Pipe 설정
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    // 400 발생 시 어떤 필드가 문제인지 콘솔에 자세히 출력
    exceptionFactory: (errors) => {
      const simplified = errors.map(err => ({
        property: err.property,
        constraints: err.constraints,
        value: err.value,
        children: err.children?.length ? err.children : undefined,
      }));
      console.error('\n[Validation Error] Incoming request validation failed:', JSON.stringify(simplified, null, 2));
      return new BadRequestException(simplified);
    }
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
