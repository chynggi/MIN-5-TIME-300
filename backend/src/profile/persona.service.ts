import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PersonaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자 프로필, 일기, 피드백 등 기반 페르소나 요약 및 목표 추출 (Gemini 활용)
   */
  async generatePersonaAndGoals(
    userId: string,
  ): Promise<{ persona: string; goals: string[] }> {
    // 1. 프로필, 관심사, 라이프스타일, 최근 일기/피드백 등 데이터 수집
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { interests: true },
    });
    const lifestyle = await this.prisma.lifestyleAnswer.findMany({
      where: { userId },
    });
    const diaries = await this.prisma.journal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    // 2. 프롬프트 구성
    const prompt = this.buildPersonaPrompt(user, lifestyle, diaries);
    // 3. Gemini API 호출 (요약 및 목표 추출)
    const apiKey = process.env.GEMINI_API_KEY || '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // 4. 결과 파싱 (예시: ---페르소나---, ---목표--- 구분)
    const persona =
      /---페르소나---([\s\S]*?)---/g.exec(text)?.[1]?.trim() || '';
    const goals =
      /---목표---([\s\S]*)/g
        .exec(text)?.[1]
        ?.split(/\n|,|-/)
        .map((s) => s.trim())
        .filter(Boolean) || [];
    return { persona, goals };
  }

  private buildPersonaPrompt(
    user: any,
    lifestyle: any[],
    diaries: any[],
  ): string {
    return `다음은 한 사용자의 자기소개, 관심사, 라이프스타일, 최근 일기입니다. 이 정보를 바탕으로 사용자의 페르소나(성향, 특징, 가치관 등)를 2~3문장으로 요약하고, 올해 이루고 싶은 목표(3~5개)를 추론해 주세요.\n\n---프로필---\n이름: ${user.username}\nMBTI: ${user.mbti}\n관심사: ${(user.interests || []).map((i: any) => i.interest).join(', ')}\n\n---라이프스타일---\n${lifestyle.map((a: any) => `Q:${a.question}\nA:${a.answer}`).join('\n')}\n\n---최근 일기---\n${diaries.map((d: any) => d.content).join('\n')}\n\n---출력 예시---\n---페르소나---\n(요약)\n---목표---\n(목표1)\n(목표2)\n...`;
  }
}
