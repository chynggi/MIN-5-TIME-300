// routes/questionRoutes.js
import express from 'express';
import Question from '../models/Question.js';
const router = express.Router();

// 질문 목록 조회
router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.getDailyQuestion();
    if (!questions) {
      return res.status(404).json({ message: '질문이 없습니다.' });
    }
    res.json(questions);
  } catch (error) {
    console.error('질문 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 질문 생성
router.post('/questions', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: '질문 내용이 필요합니다.' });
    }
    const newQuestion = await Question.addQuestion(question);
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('질문 생성 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;