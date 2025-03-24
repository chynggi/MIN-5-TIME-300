// controllers/questionController.js
import Question from '../models/question';
import { validationResult } from 'express-validator';
import { authenticateToken } from '../middlewares/authMiddleware';

const getDailyQuestion = async (req, res) => {
  try {
    const question = await Question.getDailyQuestion();
    if (question) {
      res.status(200).json(question);
    } else {
      res.status(404).json({ message: 'No questions available' });
    }
  } catch (error) {
    console.error('Error fetching daily question:', error);
    res.status(500).json({ message: 'Failed to fetch daily question' });
  }
};

const addQuestion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { question } = req.body;

  try {
    // 관리자 권한 확인
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '관리자만 질문을 추가할 수 있습니다' });
    }

    const newQuestion = await Question.addQuestion(question);
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ message: 'Failed to add question' });
  }
};

export default { getDailyQuestion, addQuestion };