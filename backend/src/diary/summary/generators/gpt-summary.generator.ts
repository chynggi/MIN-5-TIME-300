import { SummaryGeneratorInterface, DiarySummaryRequest, DiarySummaryResponse } from '../interfaces/summary-generator.interface';
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
      return { text: req.rawContent, modelUsed: this.modelName, truncated: false, fallbackUsed: true };
    }
    const maxChars = req.maxChars ?? 1200;
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(req);

    try {
      // 우선 responses API 시도 (gpt-5 가정), 실패 시 chat completions 폴백
      let raw: string | undefined;
      try {
        const resp: any = await (this.openai as any).responses.create({
          model: 'gpt-5',
          input: [
            { role: 'developer', content: [{ type: 'input_text', text: systemPrompt }] },
            { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
          ],
          text: { format: { type: 'text' }, verbosity: 'low' },
          store: false,
        });
        raw = (resp as any)?.output_text || (Array.isArray(resp.output) ? resp.output.map((o: any) => o.content?.[0]?.text).filter(Boolean).join('\n') : undefined);
      } catch (responsesErr) {
        const chat = await (this.openai as any).chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        });
        raw = chat?.choices?.[0]?.message?.content;
      }
      if (!raw || !raw.trim()) {
        return { text: req.rawContent, modelUsed: this.modelName, truncated: false, fallbackUsed: true, rawOutput: raw };
      }
      const cleaned = this.postProcess(raw);
      const { text, truncated } = this.applyLengthLimit(cleaned, maxChars);
      return { text, modelUsed: this.modelName, truncated, fallbackUsed: false, rawOutput: process.env.NODE_ENV==='development'?raw:undefined };
    } catch (e: any) {
      return { text: req.rawContent, modelUsed: this.modelName, truncated: false, fallbackUsed: true, rawOutput: e?.message };
    }
  }

  private buildSystemPrompt(): string {
    return '당신은 Q&A 형태 초안을 자연스러운 1인칭 감성 일기로 재구성하는 전문가입니다. 과도한 창작 금지, 질문 제거, 핵심 감정/행동/관계/회복/목표 보존.';
  }
  private buildUserPrompt(req: DiarySummaryRequest): string {
    return `제목(참고): ${req.title || ''}\n최대 길이: ${req.maxChars || 1200}자\n--- 원문 ---\n${req.rawContent}\n--- 끝 ---\n위 내용을 자연스럽고 단정한 한국어 일기 본문으로 출력 (머리말/꼬리말/따옴표/코드블럭 금지).`;
  }
  private postProcess(text: string): string {
    let t = text.trim();
    // 코드펜스 제거
    t = t.replace(/```[\s\S]*?```/g, '').trim();
    // JSON/설명 제거 시도 (일기 본문만 남기기)
    if (/\{\s*"/.test(t)) {
      // 모델이 JSON 형식 출력한 경우 첫 문단만 추출
      const firstParagraph = t.split(/\n{2,}/)[0];
      t = firstParagraph.replace(/\{[\s\S]*?\}/g, '').trim();
    }
    return t;
  }
}
