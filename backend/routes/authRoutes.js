// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

// __dirname 설정 (ES 모듈에서는 __dirname이 기본적으로 정의되지 않음)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// uploads 디렉토리 확인 및 생성
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email, // 이메일 정보 추가
        mbti: user.mbti,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    console.error('로그인 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 회원가입 라우트
router.post('/register', upload.single('profile_image'), async (req, res) => {
  try {
    const { username, password, mbti, email } = req.body;
    
    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({ message: '사용자 이름과 비밀번호는 필수입니다.' });
    }
    
    // 이메일 필수 검증 추가
    if (!email) {
      return res.status(400).json({ message: '이메일은 필수입니다.' });
    }
    
    // 이메일 중복 확인
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    
    // 사용자 이름 중복 확인
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: '이미 사용 중인 사용자 이름입니다.' });
    }
    
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 프로필 이미지 처리
    const profileImage = req.file ? req.file.filename : null;
    
    // DB에 사용자 추가
    const user = await User.create({
      username, 
      password: hashedPassword, 
      mbti, 
      email, 
      profile_image: profileImage
    });
    
    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mbti: user.mbti,
        profile_image: user.profile_image
      }
    });
    
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;