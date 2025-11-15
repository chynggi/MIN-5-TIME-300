import { AIModel } from '../../../question/interfaces/question-generator.interface';

export interface DiarySummaryRequest {
  rawContent: string;
  title?: string;
  maxChars?: number;
  looksLikeQA?: boolean;
  modelId?: string; // 요청에서 명시된 모델 (AIModel enum 값과 다를 수 있어 매핑 필요)
}

export interface DiarySummaryResponse {
  text: string; // 요약 결과 (트리밍 후)
  modelUsed: string; // 실제 사용된 모델명
  truncated: boolean; // 길이 제한으로 잘렸는지 여부
  fallbackUsed: boolean; // 폴백 로직 사용 여부
  rawOutput?: string; // 필요 시 디버깅
}

export abstract class SummaryGeneratorInterface {
  protected readonly modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  abstract summarize(req: DiarySummaryRequest): Promise<DiarySummaryResponse>;

  /** 공통 길이 컷 적용 */
  protected applyLengthLimit(
    text: string,
    maxChars: number,
  ): { text: string; truncated: boolean } {
    if (text.length <= maxChars) return { text, truncated: false };
    return {
      text: text.slice(0, maxChars - 3).trim() + '...',
      truncated: true,
    };
  }
}
