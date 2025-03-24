import express from 'express';
import Diary from '../models/diary.js';
const router = express.Router();

// 일기 목록 조회
router.get('/diaries', async (req, res) => {
  try {
    const userId = req.user.id; // 인증된 사용자 ID
    const entries = await Diary.getUserEntries(userId);
    res.json(entries);
  } catch (error) {
    console.error('일기 목록 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 일기 작성
router.post('/diaries', async (req, res) => {
  try {
    const userId = req.user.id; // 인증된 사용자 ID
    const { content, isShared, rating } = req.body;

    // 필수 필드 검증
    if (!content) {
      return res.status(400).json({ message: '일기 내용이 필요합니다.' });
    }

    // 마지막 작성 시간 확인
    const lastEntryTime = await Diary.getLastEntryTime(userId);
    if (lastEntryTime) {
      const lastEntryDate = new Date(lastEntryTime).toDateString();
      const today = new Date().toDateString();
      if (lastEntryDate === today) {
        return res.status(400).json({ message: '오늘은 이미 일기를 작성했습니다.' });
      }
    }

    const newEntry = await Diary.createDiaryEntry(userId, content, isShared || false, rating);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('일기 작성 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router; 