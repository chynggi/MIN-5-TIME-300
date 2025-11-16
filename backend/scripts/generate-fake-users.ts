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
  interests: { interest: string; priority?: number }[];
  lifestyle: { question: string; answer: string }[];
}

function random4() {
  return Math.floor(1000 + Math.random() * 9000);
}

function buildInterests(mbti: string): { interest: string; priority: number }[] {
  // 간단한 MBTI 기반 관심사 템플릿
  const base: string[] = (() => {
    switch (mbti) {
      case 'INTJ':
      case 'INTP':
        return ['심리학', '전략게임', '독서'];
      case 'ENTJ':
      case 'ENTP':
        return ['스타트업', '비즈니스', '토론'];
      case 'INFJ':
      case 'INFP':
        return ['글쓰기', '음악감상', '일기'];
      case 'ENFJ':
      case 'ENFP':
        return ['사람만나기', '모임기획', '콘텐츠만들기'];
      case 'ISTJ':
      case 'ISFJ':
        return ['정리정돈', '기록', '가계부'];
      case 'ESTJ':
      case 'ESFJ':
        return ['동호회', '행사준비', '가족모임'];
      case 'ISTP':
      case 'ISFP':
        return ['사진찍기', '산책', '취미활동'];
      case 'ESTP':
      case 'ESFP':
        return ['스포츠', '페스티벌', '여행'];
      default:
        return ['독서', '운동', '음악감상'];
    }
  })();

  return base.map((interest, idx) => ({ interest, priority: idx + 1 }));
}

function buildLifestyle(mbti: string): { question: string; answer: string }[] {
  // 하루 루틴/라이프스타일을 간단히 MBTI별로 다르게 구성
  switch (mbti) {
    case 'INTJ':
      return [
        { question: '평소 업무 스타일은?', answer: '우선순위를 정해 계획적으로 처리한다.' },
        { question: '휴식 방식은?', answer: '혼자만의 시간과 조용한 독서를 선호한다.' },
      ];
    case 'ENFP':
      return [
        { question: '평소 업무 스타일은?', answer: '아이디어가 떠오를 때 몰아서 집중한다.' },
        { question: '휴식 방식은?', answer: '사람들을 만나거나 새로운 곳을 돌아다닌다.' },
      ];
    case 'ISTJ':
      return [
        { question: '평소 업무 스타일은?', answer: '정해진 규칙과 절차에 따라 차근차근 진행한다.' },
        { question: '휴식 방식은?', answer: '집에서 조용히 쉬거나 정리를 한다.' },
      ];
    default:
      return [
        { question: '평소 업무 스타일은?', answer: '상황에 맞게 유연하게 조절한다.' },
        { question: '휴식 방식은?', answer: '가벼운 산책이나 콘텐츠 시청을 즐긴다.' },
      ];
  }
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
        interests: buildInterests(mbti),
        lifestyle: buildLifestyle(mbti),
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
