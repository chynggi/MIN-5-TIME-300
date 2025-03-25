import express from 'express';
import { auth } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword
} from '../controllers/profileController.js';

const router = express.Router();

// 프로필 조회
router.get('/profile', auth, getProfile);

// 프로필 정보 업데이트
router.put('/profile', auth, updateProfile);

// 프로필 이미지 업데이트
router.post('/profile-image', auth, upload.single('image'), updateProfileImage);

// 비밀번호 변경
router.post('/change-password', auth, changePassword);

export default router;