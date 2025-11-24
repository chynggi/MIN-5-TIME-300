import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const newPassword = process.argv[2] || 'test1234'; // Default password if not provided
  console.log(`Resetting all user passwords to: ${newPassword}`);

  const hash = await bcrypt.hash(newPassword, 10);

  const result = await prisma.user.updateMany({
    data: {
      passwordHash: hash,
    },
  });

  console.log(`Successfully updated passwords for ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
