// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/user.js';

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    // Authorization 헤더 디버깅
    if (!authHeader) {
      console.log('인증 헤더 누락');
      return res.status(401).json({ message: '인증 토큰이 필요합니다' });
    }
    
    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('토큰 형식 오류');
      return res.status(401).json({ message: '올바른 토큰 형식이 아닙니다' });
    }

    // JWT 검증 전 디버깅
    console.log(`토큰 검증 시도: ${token.substring(0, 10)}...`);
    
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtError) {
      console.log('JWT 검증 실패:', jwtError.message);
      return res.status(403).json({ message: '유효하지 않은 토큰입니다', error: jwtError.message });
    }
    
    // 사용자 조회
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('사용자 정보 없음:', decoded.id);
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('인증 미들웨어 오류:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};