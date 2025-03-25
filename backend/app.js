// app.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import diaryRoutes from './routes/diaryRoutes.js';
import profileRoutes from './routes/profileRoute.js';
import pool from './db.js';
import { uploadConfig, initializeUploadDirectories } from './config/uploadConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// 업로드 디렉토리 초기화
try {
  initializeUploadDirectories();
} catch (error) {
  console.error('업로드 디렉토리 초기화 실패:', error);
  process.exit(1);
}

// CORS 설정
app.use(cors({
  origin: 'http://localhost:3000', // React 앱의 주소
  credentials: true
}));

app.use(bodyParser.json());

// 정적 파일 서빙 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api', questionRoutes);
app.use('/api', diaryRoutes);
app.use('/api/user', profileRoutes);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// 데이터베이스 연결 테스트
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다`);
});