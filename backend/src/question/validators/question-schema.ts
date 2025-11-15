import { z } from 'zod';

export const QuestionItemSchema = z.object({
  domain: z.enum(['emotion', 'relationship', 'recovery', 'action', 'goal']),
  text: z.string().min(3).max(120),
});

export const QuestionSetSchema = z.object({
  questions: z.array(QuestionItemSchema).min(1).max(5),
});

export type QuestionItem = z.infer<typeof QuestionItemSchema>;
export type QuestionSet = z.infer<typeof QuestionSetSchema>;

export function tryParseQuestionJson(jsonText: string): QuestionSet | null {
  try {
    const obj = JSON.parse(jsonText);
    return QuestionSetSchema.safeParse(obj).success ? obj : null;
  } catch {
    return null;
  }
}
