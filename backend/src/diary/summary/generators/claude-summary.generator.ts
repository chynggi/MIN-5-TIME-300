import { SummaryGeneratorInterface, DiarySummaryRequest, DiarySummaryResponse } from '../interfaces/summary-generator.interface';
import { Anthropic } from '@anthropic-ai/sdk';

export class ClaudeSummaryGenerator extends SummaryGeneratorInterface {
  private readonly anthropic?: Anthropic;
  constructor() {
    super('claude-sonnet-4');
    if (process.env.CLAUDE_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    }
  }

  async summarize(req: DiarySummaryRequest): Promise<DiarySummaryResponse> {
    if (!this.anthropic) {
      return { text: req.rawContent, modelUsed: this.modelName, truncated: false, fallbackUsed: true };
    }
    const maxChars = req.maxChars ?? 1200;
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(req);
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        temperature: 0.7,
        system: systemPrompt,
        messages: [ { role: 'user', content: userPrompt } ],
      });
      const first = response.content?.[0];
      const raw = (first && first.type === 'text') ? first.text : '';
      if (!raw || !raw.trim()) {
        return { text: req.rawContent, modelUsed: this.modelName, truncated: false, fallbackUsed: true };
      }
      const cleaned = this.postProcess(raw);
      const { text, truncated } = this.applyLengthLimit(cleaned, maxChars);
      return { text, modelUsed: this.modelName, truncated, fallbackUsed: false, rawOutput: process.env.NODE_ENV==='development'?raw:undefined };
    } catch (e: any) {
      return { text: req.rawContent, modelUsed: this.modelName, truncated: false, fallbackUsed: true, rawOutput: e?.message };
    }
  }

  private buildSystemPrompt(): string {
    return '당신은 Q&A 또는 단편 메모를 감정이 풍부한 1인칭 한국어 일기로 매끄럽게 엮는 편집자입니다. 질문 문장은 제거/변환, 과도한 창작 금지.';
  }
  private buildUserPrompt(req: DiarySummaryRequest): string {
    return `제목 후보: ${req.title || ''}\n최대 길이: ${req.maxChars || 1200}자\n--- 원문 ---\n${req.rawContent}\n--- 끝 ---\n위 자료를 자연스럽고 명확한 단락(2~5)으로 된 일기 본문으로만 출력.`;
  }
  private postProcess(t: string): string {
    let out = t.trim();
    out = out.replace(/```[\s\S]*?```/g, '').trim();
    return out;
  }
}
