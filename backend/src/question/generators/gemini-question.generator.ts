import { GoogleGenAI } from '@google/genai';
import { 
  QuestionGeneratorInterface, 
  QuestionGenerationRequest, 
  QuestionGenerationResponse, 
  AIModel,
  GeneratedQuestionItem
} from '../interfaces/question-generator.interface';

export class GeminiQuestionGenerator extends QuestionGeneratorInterface {
  private readonly genai: GoogleGenAI;

  constructor() {
    super(AIModel.GEMINI_2_5_FLASH);
    this.genai = new GoogleGenAI({
      // API 키는 환경변수 GEMINI_API_KEY에서 자동으로 가져옴
    });
  }

  async generateQuestion(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
    try {
      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.createUserPrompt(request);
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const raw = await this.callAPI(fullPrompt);
      const parsed = this.parseQuestions(raw);

      if (!parsed.questions.length) throw new Error('파싱된 질문이 없습니다');

      return {
        questions: parsed.questions,
        confidence: 0.9,
        modelUsed: this.modelName,
        fallbackUsed: false,
        rawOutput: raw,
      };
    } catch (error) {
      console.error('Gemini 질문 생성 오류:', error);
      return this.getDefaultQuestionSet(request.metaInfo.dayOfWeek);
    }
  }

  private parseQuestions(raw: string): { questions: GeneratedQuestionItem[] } {
    const questions: GeneratedQuestionItem[] = [];
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}$/);
      const target = jsonMatch ? jsonMatch[0] : raw;
      const obj = JSON.parse(target);
      if (Array.isArray(obj.questions)) {
        for (const q of obj.questions) {
          if (q && typeof q.text === 'string' && typeof q.domain === 'string') {
            const text = q.text.trim();
            if (this.autoQualityFilter(text)) {
              questions.push({ domain: q.domain, text });
            }
          }
        }
      }
    } catch (e) {
      // 원시 텍스트에서 줄 단위 fallback (비정상 응답 시)
      const lines = raw.split(/\n+/).map(l => l.trim()).filter(l => l.length >= 2 && l.length <= 120).slice(0,5);
      const domains: GeneratedQuestionItem['domain'][] = ['emotion','action','relationship','recovery','goal'];
      lines.forEach((line, idx) => {
        if (this.autoQualityFilter(line)) {
          questions.push({ domain: domains[idx] || 'emotion', text: line });
        }
      });
    }
    return { questions: questions.slice(0,5) };
  }

  protected async callAPI(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      // 시스템 프롬프트와 사용자 프롬프트를 합쳐서 하나의 컨텐츠로 구성
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const response = await this.genai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // Disables thinking
          },
        },
      });

      // 응답에서 텍스트 추출
      if (response.text) {
        return response.text;
      }
      
      throw new Error('Gemini API에서 유효한 텍스트 응답을 받지 못했습니다.');
    } catch (error) {
      console.error('Gemini API 호출 오류:', error);
      throw new Error(`Gemini API 요청 실패: ${error.message || error}`);
    }
  }
}