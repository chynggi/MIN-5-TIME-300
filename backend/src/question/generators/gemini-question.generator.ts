import { GoogleGenAI } from '@google/genai';
import {
  QuestionGeneratorInterface,
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  AIModel,
  GeneratedQuestionItem,
} from '../interfaces/question-generator.interface';
import { tryParseQuestionJson } from '../validators/question-schema';

export class GeminiQuestionGenerator extends QuestionGeneratorInterface {
  private readonly genai: GoogleGenAI;

  constructor() {
    super(AIModel.GEMINI_2_5_FLASH);
    this.genai = new GoogleGenAI({
      // API 키는 환경변수 GEMINI_API_KEY에서 자동으로 가져옴
    });
  }

  async generateQuestion(
    request: QuestionGenerationRequest,
  ): Promise<QuestionGenerationResponse> {
    try {
      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.createUserPrompt(request);

      const raw = await this.callAPI(userPrompt, systemPrompt);
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

    const sanitize = (text: string) =>
      text.replace(/```+json?/gi, '```').trim();
    const work = sanitize(raw);

    // 1) 코드펜스 내부 JSON 블록 우선 추출
    let jsonCandidate: string | undefined = undefined;
    const fenceMatch = work.match(/```+\s*(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      jsonCandidate = fenceMatch[1];
    }

    // 2) 없으면 첫 '{' 부터 마지막 '}' 까지 시도 (중첩 단순 스캔)
    if (!jsonCandidate) {
      const firstBrace = work.indexOf('{');
      const lastBrace = work.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonCandidate = work.slice(firstBrace, lastBrace + 1);
      }
    }

    const tryParse = (text?: string) => {
      if (!text) return false;
      try {
        const valid = tryParseQuestionJson(text);
        if (valid) {
          for (const q of valid.questions) {
            const trimmed = q.text.trim().replace(/^['"`]+|['"`]+$/g, '');
            if (this.autoQualityFilter(trimmed))
              questions.push({ domain: q.domain, text: trimmed });
          }
          return questions.length > 0;
        }
        return false;
      } catch {
        return false;
      }
    };

    const parsedOk = tryParse(jsonCandidate) || tryParse(work);

    if (!parsedOk) {
      // 3) 라인 기반 폴백: 코드펜스, 중괄호, 빈/언어지시 라인 제거
      const lines = work
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length >= 4 &&
            l.length <= 120 &&
            !/^```/.test(l) &&
            !/^[{}\[\]]+$/.test(l) &&
            !/^"?questions"?\s*:/.test(l) &&
            !/^domain\s*:/.test(l),
        )
        .slice(0, 5);
      const domains: GeneratedQuestionItem['domain'][] = [
        'emotion',
        'action',
        'relationship',
        'recovery',
        'goal',
      ];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (this.autoQualityFilter(line)) {
          questions.push({ domain: domains[i] || 'emotion', text: line });
        }
      }
    }

    return { questions: questions.slice(0, 5) };
  }

  protected async callAPI(
    prompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    try {
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
