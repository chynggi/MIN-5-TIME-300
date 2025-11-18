-- Add selected question answers array to store user responses for reuse during edits
ALTER TABLE "Journal" ADD COLUMN "selectedQuestionAnswers" TEXT[];
