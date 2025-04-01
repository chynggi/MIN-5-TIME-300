import express from 'express';
import { auth } from '../middlewares/authMiddleware.js';
import * as recommendationController from '../controllers/rqController.js';
import * as voteController from '../controllers/voteController.js';
import * as commentController from '../controllers/qCommentController.js';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

// === 추천 질문 라우트 ===
// 모든 질문 조회 (인증 필요 없음)
router.get('/recommended-questions', recommendationController.getAllQuestions);

// 질문 상세 조회 (인증 필요 없음, 투표 정보만 인증 필요)
router.get('/recommended-questions/:id', recommendationController.getQuestionById);

// 인증이 필요한 라우트
// 질문 생성
router.post('/recommended-questions', auth, recommendationController.createQuestion);

// 질문 수정 (작성자만)
router.put('/recommended-questions/:id', auth, recommendationController.updateQuestion);

// 질문 삭제 (작성자 또는 관리자)
router.delete('/recommended-questions/:id', auth, recommendationController.deleteQuestion);

// 질문 상태 업데이트 (관리자만)
router.patch('/recommended-questions/:id/status', auth, recommendationController.updateQuestionStatus);

// === 투표 라우트 ===
// 투표하기
router.post('/recommended-questions/:id/vote', auth, voteController.voteForQuestion);

// 사용자 투표 상태 확인
router.get('/recommended-questions/:id/vote', auth, voteController.getUserVoteStatus);

// === 댓글 라우트 ===
// 질문의 모든 댓글 조회
router.get('/recommended-questions/:id/comments', commentController.getQuestionComments);

// 댓글 작성
router.post('/recommended-questions/:id/comments', auth, commentController.createComment);

// 댓글 수정
router.put('/comments/:commentId', auth, commentController.updateComment);

// 댓글 삭제
router.delete('/comments/:commentId', auth, commentController.deleteComment);

// === 카테고리 라우트 ===
// 모든 카테고리 조회
router.get('/question-categories', categoryController.getAllCategories);

// 카테고리 생성 (관리자만)
router.post('/question-categories', auth, categoryController.createCategory);

// 카테고리 수정 (관리자만)
router.put('/question-categories/:id', auth, categoryController.updateCategory);

// 카테고리 삭제 (관리자만)
router.delete('/question-categories/:id', auth, categoryController.deleteCategory);

export default router;