import express from 'express';
import { check } from 'express-validator';
import { 
  getPosts, 
  getPost, 
  createPost, 
  updatePost, 
  deletePost,
  addComment
} from '../controllers/communityController.js';
import { auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 게시글 목록 조회
router.get('/posts', auth, getPosts);

// 게시글 상세 조회
router.get('/posts/:id', auth, getPost);

// 게시글 작성
router.post(
  '/posts', 
  auth,
  [
    check('title').notEmpty().withMessage('제목은 필수 항목입니다.').isLength({ max: 255 }).withMessage('제목은 255자를 초과할 수 없습니다.'),
    check('content').notEmpty().withMessage('내용은 필수 항목입니다.')
  ],
  createPost
);

// 게시글 수정
router.put(
  '/posts/:id',
  auth,
  [
    check('title').notEmpty().withMessage('제목은 필수 항목입니다.').isLength({ max: 255 }).withMessage('제목은 255자를 초과할 수 없습니다.'),
    check('content').notEmpty().withMessage('내용은 필수 항목입니다.')
  ],
  updatePost
);

// 게시글 삭제
router.delete('/posts/:id', auth, deletePost);

// 댓글 작성
router.post(
  '/posts/:id/comments',
  auth,
  [
    check('content').notEmpty().withMessage('댓글 내용은 필수 항목입니다.')
  ],
  addComment
);

export default router;