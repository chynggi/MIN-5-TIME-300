import { SummaryGeneratorInterface, DiarySummaryRequest, DiarySummaryResponse } from '../interfaces/summary-generator.interface';
import { GoogleGenAI } from '@google/genai';

export class GeminiSummaryGenerator extends SummaryGeneratorInterface {
  private readonly genai: GoogleGenAI;
  constructor() {
    super('gemini-2.5-flash'); // 기본 요약 모델 (질문 생성과 동기화 가능)
    const apiKey = process.env.GEMINI_API_KEY;
    // SDK는 환경변수로도 키를 인식하지만, 명시적으로 전달하여 런타임 환경차 이슈를 최소화
    this.genai = new GoogleGenAI(apiKey ? { apiKey } as any : {} as any);
  }

  async summarize(req: DiarySummaryRequest): Promise<DiarySummaryResponse> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return {
        text: this.enforceRange(this.maskPII(req.rawContent)),
        modelUsed: this.modelName,
        truncated: false,
        fallbackUsed: true,
      };
    }

    const maxChars = req.maxChars ?? 1200;
    const prompt = this.buildPrompt(req.rawContent, { maxChars });

    const modelToUse = req.modelId || this.modelName;

    try {
      const result = await this.genai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      const raw: string = (result as any)?.text || '';
      const diary = this.extractDiary(raw);
      if (!diary) {
        return {
          text: this.enforceRange(this.maskPII(req.rawContent)),
          modelUsed: modelToUse,
          truncated: false,
          fallbackUsed: true,
          rawOutput: JSON.stringify(result).slice(0, 1000),
        };
      }
      const limited = this.enforceRange(this.maskPII(diary));
      return {
        text: limited,
        modelUsed: modelToUse,
        truncated: false,
        fallbackUsed: false,
        rawOutput: process.env.NODE_ENV === 'development' ? raw : undefined,
      };
    } catch (error: any) {
      return {
        text: this.enforceRange(this.maskPII(req.rawContent)),
        modelUsed: modelToUse,
        truncated: false,
        fallbackUsed: true,
        rawOutput: error?.message,
      };
    }
  }

  private buildPrompt(raw: string, ctx: { maxChars: number }): string {
    return `요약 프롬프트 최종본\n\n당신은 '일기 서술화 편집자'입니다. 오늘의 Q&A 데이터를 사람이 쓴 듯 자연스럽고 솔직한 1인칭 일기 한 문단으로 변환하세요.\n내부 분석은 출력하지 말고, 최종 결과는 반드시 JSON 형식으로만 출력합니다.\n\n[변환 목표]\n- 길이 표준화: 항상 200~400자\n- 사람다움: Q&A 나열이 아닌 한 편의 일기(구어체·숨결 있는 표현 허용)\n- 흐름: 가능하면 감정 → 관계/맥락 → 회복 → 행동 → 목표 순서\n- 사실성: Q&A에 없는 구체 사실·수치·기관명 생성 금지(가벼운 연결어는 허용)\n- 익명화: 실명/기관명/개인정보는 일반 역할명으로 치환\n\n[편집 규칙]\n- 질문 문구/도메인 라벨/불릿·해시태그 금지\n- 1인칭 어조, 친구처럼 담백하고 다정한 톤(설교·단정 금지)\n- 답변이 매우 짧으면 질문의 맥락으로 자연스레 보강, 매우 길면 중복 제거\n- 연결어 활용(그래서/그때/그러다 보니/덕분에/한편)\n\n[안전 가드레일]\n- 금지: 신체치수/외모/출신학교·정확 수치/개인정보 노출, 성 고정관념·연령/학력 차별\n- 허용: 연령/역할/자기돌봄은 간접 힌트 수준으로만\n\n[출력(JSON)]\n{\n  \"diary\": \"사람이 쓴 것처럼 자연스럽고 솔직한 1인칭 일기 문단(200~400자).\"\n}\n\n--- 원문 시작 ---\n${raw}\n--- 원문 끝 ---`;
  }
  private extractDiary(raw: string): string | null {
    try {
      const cleaned = (raw || '').replace(/```[\s\S]*?```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const json = match ? JSON.parse(match[0]) : JSON.parse(cleaned);
      const d = json?.diary;
      return typeof d === 'string' && d.trim() ? d.trim() : null;
    } catch { return null; }
  }
  private maskPII(text: string) {
    return (text||'')
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
