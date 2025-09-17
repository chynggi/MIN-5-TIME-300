import apiRequest from '@/lib/api';

export type AdviceResponse = { advice: string; risk_flag?: 'none'|'mild'|'moderate'|'severe'; tags?: string[]; id?: string; cached?: boolean };

export const adviceApi = {
  latest: (): Promise<AdviceResponse> => apiRequest('/advice/latest'),
  generate: (force = false): Promise<AdviceResponse> => apiRequest(`/advice/generate?force=${force ? 'true' : 'false'}`, { method: 'POST' }),
  feedback: (adviceId: string, helpful: boolean): Promise<{ ok: boolean }> => apiRequest('/advice/feedback', { method: 'POST', body: JSON.stringify({ adviceId, helpful }) }),
};
