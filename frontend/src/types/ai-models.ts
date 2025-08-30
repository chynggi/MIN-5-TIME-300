export interface AIModel {
  id: string;
  name: string;
  description: string;
  confidence: string;
  icon: string;
}

export interface AIModelsResponse {
  models: string[];
  defaultModel: string;
  enabledModels: string[];
}

export interface QuestionGenerationResponse {
  id: string;
  question: string;
  createdAt: string;
}

export type AIModelId = 'gemini-2.5-flash' | 'claude-sonnet-4' | 'gpt-5';

export const AI_MODELS: Record<AIModelId, AIModel> = {
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: '빠르고 효율적인 질문 생성',
    confidence: '90%',
    icon: '🤖'
  },
  'claude-sonnet-4': {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    description: '깊이 있는 분석과 고품질 질문',
    confidence: '95%',
    icon: '🧠'
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    description: '창의적이고 맥락적인 질문',
    confidence: '92%',
    icon: '⚡'
  }
};