// middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/user.js';

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: '인증이 필요합니다' });
    }

    const decoded = await jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: '유효하지 않은 토큰입니다' });
    }
    return res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
};