import { useCallback, useState } from 'react';
import { diaryApi, SaveAnswersPayloadItem, SaveAnswersResponse } from '../services/diary-api';

export function useQuestionAnswers() {
  const [preview, setPreview] = useState<SaveAnswersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAnswers = useCallback(async (qa: SaveAnswersPayloadItem[], options?: { modelId?: string; diaryDate?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await diaryApi.saveAnswers({ qa, modelId: options?.modelId, diaryDate: options?.diaryDate });
      setPreview(res);
      return res;
    } catch (e: any) {
      setError(e?.message || '저장 중 오류가 발생했습니다.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { preview, loading, error, saveAnswers };
}
