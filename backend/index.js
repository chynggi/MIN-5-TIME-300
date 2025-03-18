require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// PostgreSQL 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 기본 API 확인
app.get("/", (req, res) => {
  res.send("백엔드 서버가 정상적으로 실행 중입니다.");
});

// 서버 실행
app.listen(port, () => {
  console.log(`✅ 서버가 http://localhost:${port} 에서 실행 중`);
});
app.get("/api/question", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM questions ORDER BY created_at DESC LIMIT 1");
    res.json(result.rows[0] || { question: "오늘의 질문이 없습니다." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "질문을 가져오는 중 오류 발생" });
  }
});
app.post("/api/diary", async (req, res) => {
  const { user_id, content, is_shared, rating } = req.body;
  if (!user_id || !content) {
    return res.status(400).json({ error: "필수 데이터가 부족합니다." });
  }

  try {
    await pool.query(
      "INSERT INTO diaries (user_id, content, is_shared, rating) VALUES ($1, $2, $3, $4)",
      [user_id, content, is_shared || false, rating || null]
    );
    res.status(201).json({ message: "일기가 저장되었습니다." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "일기를 저장하는 중 오류 발생" });
  }
});
app.get("/api/shared", async (req, res) => {
  try {
    const result = await pool.query("SELECT content FROM diaries WHERE is_shared = TRUE ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "공유된 일기를 가져오는 중 오류 발생" });
  }
});
app.post("/api/user", async (req, res) => {
  const { username, mbti } = req.body;
  if (!username) {
    return res.status(400).json({ error: "사용자 이름은 필수입니다." });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (username, mbti) VALUES ($1, $2) RETURNING *",
      [username, mbti || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "사용자 등록 중 오류 발생" });
  }
});
