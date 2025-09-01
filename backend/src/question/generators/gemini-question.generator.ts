import { GoogleGenAI } from '@google/genai';
import { 
  QuestionGeneratorInterface, 
  QuestionGenerationRequest, 
  QuestionGenerationResponse, 
  AIModel 
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

      const question = await this.callAPI(fullPrompt);

      // 품질 필터 적용
      if (!this.autoQualityFilter(question)) {
        throw new Error('자동 품질 필터에 의해 차단된 질문');
      }

      return {
        question: question.trim(),
        confidence: 0.9, // Gemini는 일반적으로 높은 신뢰도
        modelUsed: this.modelName,
        fallbackUsed: false,
      };
    } catch (error) {
      console.error('Gemini 질문 생성 오류:', error);
      return this.getDefaultQuestion(request.metaInfo.dayOfWeek);
    }
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