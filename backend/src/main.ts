import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // 또는 origin: true로 모든 도메인 허용
    credentials: true, // 필요시
  });
  await app.listen(3001, '0.0.0.0');
}
bootstrap();
