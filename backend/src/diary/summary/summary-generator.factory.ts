import { AIModel } from '../../question/interfaces/question-generator.interface';
import {
  SummaryGeneratorInterface,
  DiarySummaryRequest,
} from './interfaces/summary-generator.interface';
import { GeminiSummaryGenerator } from './generators/gemini-summary.generator';
import { GPTSummaryGenerator } from './generators/gpt-summary.generator';
import { ClaudeSummaryGenerator } from './generators/claude-summary.generator';

export class SummaryGeneratorFactory {
  private static generators: Map<string, SummaryGeneratorInterface> = new Map();

  static getGenerator(model: AIModel | string): SummaryGeneratorInterface {
    const normalized = model;
    if (!this.generators.has(normalized)) {
      this.generators.set(normalized, this.createGenerator(normalized));
    }
    return this.generators.get(normalized)!;
  }

  private static createGenerator(model: string): SummaryGeneratorInterface {
    switch (model) {
      case AIModel.GEMINI_2_5_FLASH:
      case 'gemini-2.0-pro':
      case 'gemini-2.5-flash':
        return new GeminiSummaryGenerator();
      case AIModel.GPT_5:
        return new GPTSummaryGenerator();
      case AIModel.CLAUDE_SONNET_4:
        return new ClaudeSummaryGenerator();
      default:
        // 기본 Claude 사용
        return new ClaudeSummaryGenerator();
    }
  }

  static async summarize(req: DiarySummaryRequest): Promise<string> {
    const res = await this.summarizeWithMeta(req);
    return res.text;
  }

  static async summarizeWithMeta(req: DiarySummaryRequest) {
    const model = (req.modelId as AIModel) || AIModel.CLAUDE_SONNET_4;
    const generator = this.getGenerator(model);
    return generator.summarize(req);
  }
}
