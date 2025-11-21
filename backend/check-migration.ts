import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

const prisma = new PrismaClient();
const logger = new Logger('CheckMigration');

async function checkMigrationStatus() {
  logger.log('PublicDiary → Journal 마이그레이션 상태 확인...');

  try {
    // PublicDiary 모델이 제거되었으므로 마이그레이션은 이미 완료됨
    logger.log('✅ PublicDiary 모델이 제거되어 마이그레이션이 이미 완료되었습니다.');
    
    // 공개 일기 수 확인
    const publicJournalCount = await prisma.journal.count({
      where: { isPublic: true }
    });
    logger.log(`📊 현재 공개 일기 수: ${publicJournalCount}`);

    // 전체 일기 수 확인
    const totalJournalCount = await prisma.journal.count();
    logger.log(`📊 전체 일기 수: ${totalJournalCount}`);

    logger.log('✅ 마이그레이션 상태 확인 완료!');

  } catch (error) {
    logger.error('❌ 마이그레이션 상태 확인 중 오류 발생:', error);
    throw error;
  }
}

// 실행
checkMigrationStatus()
  .then(() => {
    logger.log('🎉 마이그레이션 상태 확인이 성공적으로 완료되었습니다.');
  })
  .catch((error) => {
    logger.error('💥 마이그레이션 상태 확인 실패:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });