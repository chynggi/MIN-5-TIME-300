import { writeFileSync } from 'fs';
import { join } from 'path';

const MBTIS = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
] as const;

interface FakeUser {
  email: string;
  password: string;
  username: string;
  mbti: string;
}

function random4() {
  return Math.floor(1000 + Math.random() * 9000);
}

function buildUsers(): FakeUser[] {
  const users: FakeUser[] = [];

  for (const mbti of MBTIS) {
    for (let i = 1; i <= 3; i += 1) {
      const suffix = random4();
      const lower = mbti.toLowerCase();
      users.push({
        email: `${lower}_${suffix}_user${i}@test.com`,
        password: 'test1234',
        username: `테스터_${mbti}_${i}`,
        mbti,
      });
    }
  }

  return users;
}

function main() {
  const users = buildUsers();
  const outPath = join(__dirname, '..', 'test-data', 'generated-users.json');
  writeFileSync(outPath, JSON.stringify(users, null, 2), 'utf-8');
  // eslint-disable-next-line no-console
  console.log('✅ generated-users.json 생성 완료:', outPath, `총 ${users.length}명`);
}

main();
