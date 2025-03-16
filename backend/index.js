require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// PostgreSQL 풀 생성
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 기본 라우트 예제
app.get('/', (req, res) => {
  res.send('Hello from Node.js with PostgreSQL!');
});

// 간단한 GET API: 데이터베이스에서 데이터 조회
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mydatabase');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
