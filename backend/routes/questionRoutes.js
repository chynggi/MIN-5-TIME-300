// routes/questionRoutes.js
import express from 'express';
import questionController from '../controllers/questionController';
import { body } from 'express-validator';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/daily', questionController.getDailyQuestion);
router.post(
  '/add',
  authenticateToken,
  [body('question').notEmpty().withMessage('질문은 비어있을 수 없습니다.')],
  questionController.addQuestion
);

export default router;