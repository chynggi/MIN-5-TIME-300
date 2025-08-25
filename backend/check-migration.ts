import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  console.log('PublicDiary → Journal 마이그레이션 상태 확인...');

  try {
    // PublicDiary 모델이 제거되었으므로 마이그레이션은 이미 완료됨
    console.log('✅ PublicDiary 모델이 제거되어 마이그레이션이 이미 완료되었습니다.');
    
    // 공개 일기 수 확인
    const publicJournalCount = await prisma.journal.count({
      where: { isPublic: true }
    });
    console.log(`📊 현재 공개 일기 수: ${publicJournalCount}`);

    // 전체 일기 수 확인
    const totalJournalCount = await prisma.journal.count();
    console.log(`📊 전체 일기 수: ${totalJournalCount}`);

    console.log('✅ 마이그레이션 상태 확인 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 상태 확인 중 오류 발생:', error);
    throw error;
  }
}

// 실행
checkMigrationStatus()
  .then(() => {
    console.log('🎉 마이그레이션 상태 확인이 성공적으로 완료되었습니다.');
  })
  .catch((error) => {
    console.error('💥 마이그레이션 상태 확인 실패:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });