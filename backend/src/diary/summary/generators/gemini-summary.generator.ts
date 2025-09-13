import { SummaryGeneratorInterface, DiarySummaryRequest, DiarySummaryResponse } from '../interfaces/summary-generator.interface';
import { GoogleGenAI } from '@google/genai';

export class GeminiSummaryGenerator extends SummaryGeneratorInterface {
  private readonly genai: GoogleGenAI;
  constructor() {
    super('gemini-2.5-flash'); // 기본 요약 모델 (질문 생성과 동기화 가능)
    this.genai = new GoogleGenAI({});
  }

  async summarize(req: DiarySummaryRequest): Promise<DiarySummaryResponse> {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return {
        text: req.rawContent,
        modelUsed: this.modelName,
        truncated: false,
        fallbackUsed: true,
      };
    }

    const maxChars = req.maxChars ?? 1200;
    const looksLikeQA = typeof req.looksLikeQA === 'boolean'
      ? req.looksLikeQA
      : /(\?|:).*\n/.test(req.rawContent) || /\n\n.+\n\n/.test(req.rawContent);

    const prompt = this.buildPrompt(req.rawContent, {
      title: req.title,
      looksLikeQA,
      maxChars,
    });

    const modelToUse = req.modelId || this.modelName;

    try {
      const result = await this.genai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      const text: string = (result as any)?.text || '';
      if (!text.trim()) {
        return {
          text: req.rawContent,
          modelUsed: modelToUse,
          truncated: false,
          fallbackUsed: true,
          rawOutput: JSON.stringify(result).slice(0, 1000),
        };
      }
      const trimmed = text.trim();
      const { text: limited, truncated } = this.applyLengthLimit(trimmed, maxChars);
      return {
        text: limited,
        modelUsed: modelToUse,
        truncated,
        fallbackUsed: false,
        rawOutput: process.env.NODE_ENV === 'development' ? trimmed : undefined,
      };
    } catch (error: any) {
      return {
        text: req.rawContent,
        modelUsed: modelToUse,
        truncated: false,
        fallbackUsed: true,
        rawOutput: error?.message,
      };
    }
  }

  private buildPrompt(raw: string, ctx: { title?: string; looksLikeQA: boolean; maxChars: number }): string {
    return `다음은 사용자가 오늘 작성한 일기의 초안입니다.\n초안은 AI 질문에 대한 답변들이 나열된 형태일 수 있습니다.\n이를 자연스럽고 감정이 잘 드러나는 1인칭 한국어 일기 본문으로 재구성해 주세요.\n조건:\n1) 과도한 창작을 하지 말고, 주어진 내용 범위 내에서 자연스러운 연결 문장과 흐름을 만드세요.\n2) 질문 문장은 제거하거나 간접화하여 문단 흐름에 녹여 주세요.\n3) 핵심 감정, 행동, 관계, 회복/휴식, 내일의 작은 목표가 있다면 모두 포함하세요.\n4) 가능하면 2~5개의 짧은 문단으로 나누고, 한 문단은 너무 길지 않게 (2~4문장).\n5) 1인칭 과거 혹은 현재 시제로 자연스럽게 서술하세요.\n6) 출력은 순수 본문만, 불필요한 머리말/꼬리말/마크다운/따옴표 금지.\n7) 최대 ${ctx.maxChars}자 이내.\n${ctx.title ? `사용자가 생각한 제목(참고, 반드시 그대로 사용할 필요 없음): ${ctx.title}\n` : ''}\n--- 원문 시작 ---\n${raw}\n--- 원문 끝 ---\n이제 위 내용을 기반으로 정제된 일기 본문만 출력하세요.`;
  }
}
