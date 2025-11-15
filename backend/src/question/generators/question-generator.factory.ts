import {
  AIModel,
  QuestionGeneratorInterface,
} from '../interfaces/question-generator.interface';
import { GeminiQuestionGenerator } from './gemini-question.generator';
import { ClaudeQuestionGenerator } from './claude-question.generator';
import { GPTQuestionGenerator } from './gpt-question.generator';

export class QuestionGeneratorFactory {
  private static generators: Map<AIModel, QuestionGeneratorInterface> =
    new Map();

  static getGenerator(model: AIModel): QuestionGeneratorInterface {
    if (!this.generators.has(model)) {
      this.generators.set(model, this.createGenerator(model));
    }
    return this.generators.get(model)!;
  }

  private static createGenerator(model: AIModel): QuestionGeneratorInterface {
    switch (model) {
      case AIModel.GEMINI_2_5_FLASH:
        return new GeminiQuestionGenerator();
      case AIModel.CLAUDE_SONNET_4:
        return new ClaudeQuestionGenerator();
      case AIModel.GPT_5:
        return new GPTQuestionGenerator();
      default:
        throw new Error(`지원하지 않는 AI 모델: ${model}`);
    }
  }

  // 사용 가능한 모든 모델 반환
  static getAvailableModels(): AIModel[] {
    return Object.values(AIModel);
  }

  // 환경변수 기반으로 사용 가능한 모델 확인
  static getEnabledModels(): AIModel[] {
    const enabledModels: AIModel[] = [];

    // API 키가 있고 유효한 경우에만 모델 활성화
    if (this.isApiKeyValid('GEMINI_API_KEY')) {
      enabledModels.push(AIModel.GEMINI_2_5_FLASH);
    }

    if (this.isApiKeyValid('CLAUDE_API_KEY')) {
      enabledModels.push(AIModel.CLAUDE_SONNET_4);
    }

    if (this.isApiKeyValid('OPENAI_API_KEY')) {
      enabledModels.push(AIModel.GPT_5);
    }

    // 최소 하나는 활성화되어야 함 (Gemini를 기본으로)
    if (enabledModels.length === 0) {
      console.log(
        '경고: 활성화된 AI 모델이 없습니다. Gemini를 기본으로 설정합니다.',
      );
      enabledModels.push(AIModel.GEMINI_2_5_FLASH);
    }

    return enabledModels;
  }

  // API 키 유효성 검사
  private static isApiKeyValid(envVarName: string): boolean {
    const apiKey = process.env[envVarName];
    return !!(apiKey && apiKey.trim().length > 10); // 최소 길이 체크
  }

  // 기본 모델 선택 (우선순위: Gemini > GPT-5 > Claude - 안정성 기준)
  static getDefaultModel(): AIModel {
    const enabledModels = this.getEnabledModels();

    // Gemini를 1순위로 (가장 안정적)
    if (enabledModels.includes(AIModel.GEMINI_2_5_FLASH)) {
      return AIModel.GEMINI_2_5_FLASH;
    }

    if (enabledModels.includes(AIModel.GPT_5)) {
      return AIModel.GPT_5;
    }

    if (enabledModels.includes(AIModel.CLAUDE_SONNET_4)) {
      return AIModel.CLAUDE_SONNET_4;
    }

    // 모든 API 키가 없는 경우 기본값으로 Gemini 사용 (폴백 질문 제공)
    return AIModel.GEMINI_2_5_FLASH;
  }

  // 모델별 안정성 점수 (1-10, 높을수록 안정적)
  static getModelStability(model: AIModel): number {
    switch (model) {
      case AIModel.GEMINI_2_5_FLASH:
        return 9; // 구글의 안정적인 서비스
      case AIModel.GPT_5:
        return 7; // OpenAI 서비스, 가끔 과부하
      case AIModel.CLAUDE_SONNET_4:
        return 6; // Anthropic 서비스, 종종 과부하
      default:
        return 5;
    }
  }

  // 안정성 기준으로 정렬된 모델 목록
  static getModelsByStability(): AIModel[] {
    const models = this.getEnabledModels();
    return models.sort(
      (a, b) => this.getModelStability(b) - this.getModelStability(a),
    );
  }
}
