export class ProfileOptionsDto {
  interests: string[];
  lifestyleOptions: {
    workStyles: string[];
    exerciseFrequencies: string[];
    sleepPatterns: string[];
    socialActivities: string[];
  };
  mbtiTypes: string[];
}

export class LifestyleQuestionDto {
  id: string;
  question: string;
  options: string[];
  type: 'single' | 'multiple' | 'text';
}
