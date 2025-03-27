import express from 'express';
import { auth } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import {
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword
} from '../controllers/profileController.js';
import pool from '../db.js';

const router = express.Router();

// 사용자 프로필 조회 API
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, mbti, email, profile_image, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 프로필 업데이트 API (email 필드 추가)
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, mbti, email } = req.body;
    
    // 이메일 중복 확인 (자신의 이메일 제외)
    if (email) {
      const existingEmail = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );
      if (existingEmail.rows.length > 0) {
        return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
      }
    }
    
    // 사용자 이름 중복 확인 (자신의 사용자 이름 제외)
    if (username) {
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE username = $1 AND id != $2',
        [username, req.user.id]
      );
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: '이미 사용 중인 사용자 이름입니다.' });
      }
    }
    
    // 프로필 업데이트
    const result = await pool.query(
      'UPDATE users SET username = COALESCE($1, username), mbti = COALESCE($2, mbti), email = COALESCE($3, email) WHERE id = $4 RETURNING id, username, mbti, email, profile_image',
      [username, mbti, email, req.user.id]
    );
    
    res.json({
      message: '프로필이 업데이트되었습니다.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 프로필 이미지 업데이트
router.post('/profile-image', auth, upload.single('image'), updateProfileImage);

// 비밀번호 변경
router.post('/change-password', auth, changePassword);

export default router;