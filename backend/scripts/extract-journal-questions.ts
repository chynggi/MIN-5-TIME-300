
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        journals: {
          select: {
            selectedQuestionTexts: true,
            selectedQuestionDomains: true,
            selectedQuestionAnswers: true,
            diaryDate: true,
            writingDuration: true
          },
          where: {
            selectedQuestionTexts: {
              isEmpty: false
            }
          }
        },
      },      
    });

    //dailyCheckin 추가
    for (const user of users) {
      for (const journal of user.journals) {
        const checkin = await prisma.dailyCheckin.findFirst({
          where: {
            userId: user.id,
            diaryDate: journal.diaryDate
          },
          select: //select all 
          {
            mood_1to10: true,
            energy_1to10: true,
            stress_1to10: true,
            sleep_hours_1to9p: true,
            sleep_quality_1to10: true,
            activity_types: true,
            workout_intensity_1to10: true,
            focus_1to10: true,
            fatigue_1to10: true,
            social_count_1to10: true,
            social_satisfaction_1to10: true
          }
        });
        (journal as any).checkin = checkin;
      }
    }

    const result = users.map(user => ({
      username: user.username,
      journals: user.journals.map(j => ({
        diaryDate: j.diaryDate,
        questions: j.selectedQuestionTexts,
        domains: j.selectedQuestionDomains,
        answers: j.selectedQuestionAnswers,
        writingDuration: j.writingDuration,
        checkin : (j as any).checkin || null
      }))
    }));

    const outputFile = process.argv[2] || 'journal-questions.json';
    const outputPath = path.isAbsolute(outputFile) 
      ? outputFile 
      : path.join(process.cwd(), outputFile);

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Data successfully written to: ${outputPath}`);
  } catch (error) {
    console.error('Error extracting data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
