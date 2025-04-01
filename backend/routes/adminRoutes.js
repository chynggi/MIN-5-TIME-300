import express from 'express';
import { auth } from '../middlewares/authMiddleware.js';
import { 
  getSystemStats, 
  getMbtiDistribution, 
  getRecentUsers, 
  getDailyActivityStats,
  isAdmin 
} from '../controllers/adminController.js';

const router = express.Router();

// 모든 관리자 라우트는 인증 및 관리자 권한 확인이 필요
router.use(auth, isAdmin);

// 시스템 통계 조회
router.get('/stats', getSystemStats);

// MBTI 분포 조회
router.get('/mbti-distribution', getMbtiDistribution);

// 최근 가입 사용자 목록 조회
router.get('/recent-users', getRecentUsers);

// 일일 활동 통계 조회
router.get('/daily-activity', getDailyActivityStats);

export default router;