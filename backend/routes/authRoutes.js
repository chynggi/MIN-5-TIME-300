// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

// 로그인 라우트
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({ message: '사용자명과 비밀번호가 필요합니다.' });
    }

    // 사용자 찾기
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: '잘못된 사용자명 또는 비밀번호입니다.' });
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '잘못된 사용자명 또는 비밀번호입니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('로그인 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 회원가입 라우트
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({ message: '사용자명과 비밀번호가 필요합니다.' });
    }

    // 사용자명 중복 검사
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: '이미 사용 중인 사용자명입니다.' });
    }

    // 새 사용자 생성
    const newUser = await User.createUser(username, password);
    res.status(201).json({ message: '회원가입이 완료되었습니다.', user: newUser });
  } catch (error) {
    console.error('회원가입 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;