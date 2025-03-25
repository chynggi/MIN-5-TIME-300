// controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import config from '../config/config';
import { validationResult } from 'express-validator';

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, mbti } = req.body;
  let profileImage = null;
  // 파일 업로드 미들웨어가 적용된 경우 req.file에서 파일 정보 확인
  if (req.file) {
    // 파일명 또는 파일 경로를 저장할 수 있습니다.
    profileImage = req.file.filename;
  }

  try {
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const newUser = await User.createUser(username, password, mbti || null, profileImage);
    const token = jwt.sign({ id: newUser.id }, config.jwtSecret);
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, config.jwtSecret);
    res.status(200).json({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
};

export default { register, login };