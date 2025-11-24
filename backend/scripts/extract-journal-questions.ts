
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        username: true,
        journals: {
          select: {
            selectedQuestionTexts: true,
            diaryDate: true,
          },
          where: {
            selectedQuestionTexts: {
              isEmpty: false
            }
          }
        },
      },
    });

    const result = users.map(user => ({
      username: user.username,
      journals: user.journals.map(j => ({
        diaryDate: j.diaryDate,
        questions: j.selectedQuestionTexts
      }))
    }));

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error extracting data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
