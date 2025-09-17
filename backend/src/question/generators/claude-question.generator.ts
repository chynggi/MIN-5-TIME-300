import { Anthropic } from '@anthropic-ai/sdk';
import { 
  QuestionGeneratorInterface, 
  QuestionGenerationRequest, 
  QuestionGenerationResponse, 
  AIModel,
  GeneratedQuestionItem
} from '../interfaces/question-generator.interface';
import { tryParseQuestionJson } from '../validators/question-schema';

export class ClaudeQuestionGenerator extends QuestionGeneratorInterface {
  private readonly anthropic: Anthropic;

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

  async generateQuestion(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
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
      console.error('Claude 질문 생성 오류:', error);
      return this.getDefaultQuestionSet(request.metaInfo.dayOfWeek);
    }
  }

  private parseQuestions(raw: string): { questions: GeneratedQuestionItem[] } {
    const questions: GeneratedQuestionItem[] = [];
    const sanitized = raw.replace(/```+json?/gi,'```');

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
            const text = q.text.trim().replace(/^['"`]+|['"`]+$/g,'');
            if (this.autoQualityFilter(text)) questions.push({ domain: q.domain, text });
          }
          return questions.length > 0;
        }
        return false;
      } catch { return false; }
    };

    const parsed = tryParse(extractJson()) || tryParse(sanitized);

    if (!parsed) {
      const lines = sanitized.split(/\n+/)
        .map(l => l.replace(/^[-*\d.\s]+/, '').trim())
        .filter(l => l.length >= 4 && l.length <= 120 && !/^```/.test(l) && !/^[{}\[\]]+$/.test(l) && !/^"?questions"?\s*:/.test(l))
        .slice(0,5);
      const domains: GeneratedQuestionItem['domain'][] = ['emotion','action','relationship','recovery','goal'];
      for (let i=0;i<lines.length;i++) {
        const text = lines[i];
        if (this.autoQualityFilter(text)) {
          questions.push({ domain: domains[i] || 'emotion', text });
        }
      }
    }

    return { questions: questions.slice(0,5) };
  }

  protected async callAPI(userPrompt: string, systemPrompt?: string): Promise<string> {
    try {
      // API 키 재검증
      if (!process.env.CLAUDE_API_KEY) {
        throw new Error('Claude API 키가 설정되지 않았습니다');
      }

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', // 현재 사용 가능한 최신 모델
        max_tokens: 500,
        temperature: 0.7,
        system: systemPrompt || this.createSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // 응답에서 텍스트 추출
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (firstContent.type === 'text') {
          const output = firstContent.text;
          if (!output || output.trim().length === 0) {
            throw new Error('Claude API에서 빈 응답을 받았습니다');
          }
          return output.trim();
        }
      }
      
      throw new Error('Claude API에서 유효한 텍스트 응답을 받지 못했습니다.');
    } catch (error) {
      console.error('Claude API 호출 오류:', error);
      
      // API 과부하 체크
      if (error.status === 529 || error.message?.includes('overload')) {
        throw new Error('Claude API가 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
      }
      
      throw new Error(`Claude API 요청 실패: ${error.message || error}`);
    }
  }

  // Claude는 system 프롬프트를 별도로 지원하므로 조금 다른 구조 사용
  protected createSystemPrompt(): string {
    return `당신은 사용자의 일기 작성을 돕는 질문 생성 전문가입니다.
사용자의 MBTI, 관심사, 라이프스타일, 최근 일기 내용을 분석하여 짧고 공감을 유도하는 질문을 생성해주세요.

핵심 요구사항:
- 질문은 반드시 25자 내외로 짧게 작성
- 사용자가 깊이 생각하고 감정을 표현할 수 있도록 설계
- 질문 자체만 출력 (따옴표나 부가 설명 금지)
- 5분 동안 작성 가능한 분량의 성찰을 유도

질문 유형 (MBTI 기반 선택):
1. 감정 탐색형: 사용자의 감정 상태를 탐색
2. 회고형: 과거 경험이나 기억을 회상
3. 상상형: 미래나 가상 상황을 상상
4. 가치관형: 사용자의 가치관이나 신념을 탐색
5. 일상 관찰형: 일상의 작은 부분을 관찰

MBTI별 질문 접근법:
- I(내향형): 깊은 내적 탐색 유도
- E(외향형): 경험과 관계 중심
- S(감각형): 구체적이고 현실적
- N(직관형): 추상적이고 미래지향적
- T(사고형): 논리적 분석 요구
- F(감정형): 감정과 가치 중심
- J(판단형): 결정과 계획 관련
- P(인식형): 가능성과 탐색 중심

제약사항:
- 최근 일기 내용과 중복 금지
- 요일과 시간대 고려
- 개인화된 맥락 반영`;
  }
}