import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';

const MBTIS = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
] as const;

const LENGTH_CONFIG = {
  short: { min: 20, max: 50 },
  medium: { min: 100, max: 200 },
  long: { min: 300, max: 500 },
  very_long: { min: 1000, max: 1400 },
} as const;

const STYLE_KEYS = ['emotional', 'analytical', 'action', 'relationship'] as const;

type LengthKey = keyof typeof LENGTH_CONFIG;
type StyleKey = (typeof STYLE_KEYS)[number];

type MbtiProfileConfig = Record<
  string,
  {
    styles: Record<StyleKey, string>;
  }
>;

type GeneratedDiarySet = Record<
  (typeof MBTIS)[number],
  Record<StyleKey, Record<LengthKey, string>>
>;

const logger = new Logger('GenerateMbtiTexts');

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 환경 변수가 필요합니다.');
  }

  const configPath = join(__dirname, '..', 'test-data', 'mbti-profile-config.json');
  const configRaw = readFileSync(configPath, 'utf-8');
  const mbtiConfig: MbtiProfileConfig = JSON.parse(configRaw);

  const client = new Anthropic({ apiKey });

  const result: GeneratedDiarySet = {} as any;

  for (const mbti of MBTIS) {
    const profile = mbtiConfig[mbti];
    if (!profile) {
      throw new Error(`MBTI 설정 없음: ${mbti}`);
    }

    result[mbti] = {} as any;

    for (const styleKey of STYLE_KEYS) {
      const styleDesc = profile.styles[styleKey];
      if (!styleDesc) {
        throw new Error(`스타일 설정 없음: ${mbti} / ${styleKey}`);
      }

      result[mbti][styleKey] = {} as any;

      for (const lengthKey of Object.keys(LENGTH_CONFIG) as LengthKey[]) {
        const { min, max } = LENGTH_CONFIG[lengthKey];

        const prompt = `당신은 MBTI 전문가이자 감성적인 한국어 작가입니다.
MBTI 유형: ${mbti}
요청 문체(스타일): ${styleKey}
문체 설명: ${styleDesc}
요청: 아래 조건을 만족하는 "하루 일기" 텍스트를 한 개만 작성하세요.

- 1인칭 시점의 자연스러운 한국어 문장
- 사용자의 하루 기분, 행동, 생각, 관계, 계획 등이 적절히 섞일 것
- 위 문체 설명이 잘 드러나도록 작성할 것
- 줄바꿈은 자유롭게 사용해도 되지만, HTML 태그는 사용하지 마세요.
- 글자 수는 공백 포함 대략 ${min}~${max}자 정도로 맞춰주세요.

출력 형식: 순수 한국어 일기 텍스트만 출력하고, 설명이나 따옴표는 붙이지 마세요.`;

        const message = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          temperature: 0.9,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const text = message.content
          .map((c) => (c.type === 'text' ? c.text : ''))
          .join('\n')
          .trim();

        result[mbti][styleKey][lengthKey] = text;
        // 간단 로그
        logger.debug(
          `[generated] ${mbti} / ${styleKey} / ${lengthKey} length=${text.length}`,
        );
      }
    }
  }

  const outPath = join(__dirname, '..', 'test-data', 'generated-diaries.json');
  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  logger.log(`✅ generated-diaries.json 생성 완료: ${outPath}`);
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
