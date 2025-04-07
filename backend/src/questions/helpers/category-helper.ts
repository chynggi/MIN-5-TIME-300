import { QuestionCategory } from '../enums/question-category.enum';

/**
 * 각 육하원칙 카테고리별 이름과 설명
 */
export const getCategoryInfo = (categoryId: number): { name: string; description: string } => {
  const categories = {
    [QuestionCategory.WHO]: {
      name: '누가 (Who)',
      description: '인물, 관계에 관한 질문들입니다. 자신과 타인의 행동, 생각, 감정에 대해 탐색합니다.'
    },
    [QuestionCategory.WHEN]: {
      name: '언제 (When)',
      description: '시간, 시기에 관한 질문들입니다. 과거, 현재, 미래의 특정 순간이나 기간에 대해 생각해볼 수 있습니다.'
    },
    [QuestionCategory.WHERE]: {
      name: '어디서 (Where)',
      description: '장소, 위치에 관한 질문들입니다. 공간적 맥락과 환경이 미치는 영향에 대해 생각해볼 수 있습니다.'
    },
    [QuestionCategory.WHAT]: {
      name: '무엇을 (What)',
      description: '사건, 사물에 관한 질문들입니다. 경험한 일이나 대상에 대해 구체적으로 탐색합니다.'
    },
    [QuestionCategory.HOW]: {
      name: '어떻게 (How)',
      description: '방법, 과정에 관한 질문들입니다. 일이 진행된 과정이나 해결책을 모색하는 데 도움을 줍니다.'
    },
    [QuestionCategory.WHY]: {
      name: '왜 (Why)',
      description: '이유, 원인에 관한 질문들입니다. 동기와 근본적인 원인에 대해 깊이 생각할 수 있습니다.'
    }
  };

  return categories[categoryId] || { name: '기타', description: '분류되지 않은 질문입니다.' };
};

/**
 * 모든 육하원칙 카테고리 정보 반환
 */
export const getAllCategories = () => {
  return Object.values(QuestionCategory)
    .filter(value => typeof value === 'number')
    .map(id => ({
      id,
      ...getCategoryInfo(id as number)
    }));
};