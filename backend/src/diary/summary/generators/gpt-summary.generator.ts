import {
  SummaryGeneratorInterface,
  DiarySummaryRequest,
  DiarySummaryResponse,
} from '../interfaces/summary-generator.interface';
import OpenAI from 'openai';

export class GPTSummaryGenerator extends SummaryGeneratorInterface {
  private readonly openai?: OpenAI;
  constructor() {
    super('gpt-5');
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async summarize(req: DiarySummaryRequest): Promise<DiarySummaryResponse> {
    if (!this.openai) {
      return {
        text: this.enforceRange(this.maskPII(req.rawContent)),
        modelUsed: this.modelName,
        truncated: false,
        fallbackUsed: true,
      };
    }
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(req);

    try {
      // 우선 responses API 시도 (gpt-5 가정), 실패 시 chat completions 폴백
      let raw: string | undefined;
      try {
        const resp: any = await (this.openai as any).responses.create({
          model: 'gpt-5',
          input: [
            {
              role: 'developer',
              content: [{ type: 'input_text', text: systemPrompt }],
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: userPrompt }],
            },
          ],
          text: { format: { type: 'text' }, verbosity: 'low' },
          store: false,
        });
        raw =
          resp?.output_text ||
          (Array.isArray(resp.output)
            ? resp.output
                .map((o: any) => o.content?.[0]?.text)
                .filter(Boolean)
                .join('\n')
            : undefined);
      } catch (responsesErr) {
        const chat = await (this.openai as any).chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.5,
        });
        raw = chat?.choices?.[0]?.message?.content;
      }
      const diary = this.extractDiary(raw || '');
      const finalText = diary
        ? this.enforceRange(this.maskPII(diary))
        : this.enforceRange(this.maskPII(req.rawContent));
      return {
        text: finalText,
        modelUsed: this.modelName,
        truncated: false,
        fallbackUsed: !diary,
        rawOutput: process.env.NODE_ENV === 'development' ? raw : undefined,
      };
    } catch (e: any) {
      return {
        text: this.enforceRange(this.maskPII(req.rawContent)),
        modelUsed: this.modelName,
        truncated: false,
        fallbackUsed: true,
        rawOutput: e?.message,
      };
    }
  }

  private buildSystemPrompt(): string {
    return `당신은 '일기 서술화 편집자'입니다. 오늘의 Q&A 데이터를 사람이 쓴 듯 자연스럽고 솔직한 1인칭 일기 한 문단으로 변환하세요.
내부 분석은 출력하지 말고, 최종 결과는 반드시 JSON 형식으로만 출력합니다.

[변환 목표]
- 길이 표준화: 항상 200~400자
- 사람다움: Q&A 나열이 아닌 한 편의 일기(구어체·숨결 있는 표현 허용)
- 흐름: 가능하면 감정 → 관계/맥락 → 회복 → 행동 → 목표 순서
- 사실성: Q&A에 없는 구체 사실·수치·기관명 생성 금지(가벼운 연결어는 허용)
- 익명화: 실명/기관명/개인정보는 일반 역할명으로 치환

[편집 규칙]
- 질문 문구/도메인 라벨/불릿·해시태그 금지
- 1인칭 어조, 친구처럼 담백하고 다정한 톤(설교·단정 금지)
- 답변이 매우 짧으면 질문 맥락으로 자연스레 보강, 매우 길면 중복 제거
- 연결어 활용(그래서/그때/그러다 보니/덕분에/한편)

[안전 가드레일]
- 금지: 신체치수/외모/출신학교·정확 수치/개인정보 노출, 성 고정관념·연령/학력 차별
- 허용: 연령/역할/자기돌봄은 간접 힌트 수준으로만

[출력(JSON)]
{"diary":"사람이 쓴 것처럼 자연스럽고 솔직한 1인칭 일기 문단(200~400자)."}`;
  }
  private buildUserPrompt(req: DiarySummaryRequest): string {
    return `# 입력(Q&A 기반 서술화)
원본 초안:
${req.rawContent}

# 출력 규칙
- JSON만 출력: {"diary":"..."}
- 길이: 200~400자, 1인칭, 구어체 허용, Q&A/라벨/불릿 제거`;
  }
  private extractDiary(raw: string): string | null {
    try {
      const cleaned = (raw || '').replace(/```[\s\S]*?```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const json = match ? JSON.parse(match[0]) : JSON.parse(cleaned);
      const d = json?.diary;
      return typeof d === 'string' && d.trim() ? d.trim() : null;
    } catch {
      return null;
    }
  }
  private maskPII(text: string) {
    return (text || '')
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[이메일]')
      .replace(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, '[연락처]')
      .replace(/\b\d{10,11}\b/g, '[연락처]');
  }
  private enforceRange(text: string) {
    const t = text.trim();
    if (t.length < 200) return t.padEnd(200, ' ').slice(0, 200);
    if (t.length > 400) return t.slice(0, 400);
    return t;
  }
}
