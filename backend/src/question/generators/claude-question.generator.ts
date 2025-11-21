import { Anthropic } from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';
import {
  QuestionGeneratorInterface,
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  AIModel,
  GeneratedQuestionItem,
} from '../interfaces/question-generator.interface';
import { tryParseQuestionJson } from '../validators/question-schema';

export class ClaudeQuestionGenerator extends QuestionGeneratorInterface {
  private readonly anthropic: Anthropic;
  private readonly logger = new Logger(ClaudeQuestionGenerator.name);

  constructor() {
    super(AIModel.CLAUDE_SONNET_4);

    // API 키 검증
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('Claude API 키가 설정되지 않았습니다');
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
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
      if (!parsed.questions.length) throw new Error('파싱된 질문 없음');
      return {
        questions: parsed.questions,
        confidence: 0.95,
        modelUsed: this.modelName,
        fallbackUsed: false,
        rawOutput: raw,
      };
    } catch (error) {
      this.logger.error('Claude 질문 생성 오류:', error);
      return this.getDefaultQuestionSet(request.metaInfo.dayOfWeek);
    }
  }

  private parseQuestions(raw: string): { questions: GeneratedQuestionItem[] } {
    const questions: GeneratedQuestionItem[] = [];
    const sanitized = raw.replace(/```+json?/gi, '```');

    const extractJson = (): string | undefined => {
      const fence = sanitized.match(/```+\s*(?:json)?\s*([\s\S]*?)```/i);
      if (fence) return fence[1];
      const start = sanitized.indexOf('{');
      const end = sanitized.lastIndexOf('}');
      if (start !== -1 && end > start) return sanitized.slice(start, end + 1);
    };

    const tryParse = (candidate?: string) => {
      if (!candidate) return false;
      try {
        const valid = tryParseQuestionJson(candidate);
        if (valid) {
          for (const q of valid.questions) {
            const text = q.text.trim().replace(/^['"`]+|['"`]+$/g, '');
            if (this.autoQualityFilter(text))
              questions.push({ domain: q.domain, text });
          }
          return questions.length > 0;
        }
        return false;
      } catch {
        return false;
      }
    };

    const parsed = tryParse(extractJson()) || tryParse(sanitized);

    if (!parsed) {
      const lines = sanitized
        .split(/\n+/)
        .map((l) => l.replace(/^[-*\d.\s]+/, '').trim())
        .filter(
          (l) =>
            l.length >= 4 &&
            l.length <= 120 &&
            !/^```/.test(l) &&
            !/^[{}\[\]]+$/.test(l) &&
            !/^"?questions"?\s*:/.test(l),
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
        const text = lines[i];
        if (this.autoQualityFilter(text)) {
          questions.push({ domain: domains[i] || 'emotion', text });
        }
      }
    }

    return { questions: questions.slice(0, 5) };
  }

  protected async callAPI(
    userPrompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    try {
      // API 키 재검증
      if (!process.env.CLAUDE_API_KEY) {
        throw new Error('Claude API 키가 설정되지 않았습니다');
      }

      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929", // 현재 사용 가능한 최신 모델
        max_tokens: 5000,
        temperature: 0.25,
        system: systemPrompt || this.createSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
      if (response.stop_reason === 'refusal') {
        throw new Error('Claude가 요청을 거부했습니다.');
      }
      // 응답에서 텍스트 추출
      if (response.content && response.content.length > 0) {
        for (const block of response.content) {
          if (block.type == "thinking"){
            continue; // 생각 블록은 건너뜁니다.
          }
          else if (block.type == "text"){            
            const output = block.text;
            if (!output || output.trim().length === 0) {
              throw new Error('Claude API에서 빈 응답을 받았습니다');
            }
            return output.trim();        
          }
        
      }
    }   

      throw new Error('Claude API에서 유효한 텍스트 응답을 받지 못했습니다.');
    } catch (error) {
      this.logger.error('Claude API 호출 오류:', error);

      // API 과부하 체크
      if (error.status === 529 || error.message?.includes('overload')) {
        throw new Error(
          'Claude API가 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
        );
      }

      throw new Error(`Claude API 요청 실패: ${error.message || error}`);
    }
  }
}
