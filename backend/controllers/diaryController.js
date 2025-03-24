// controllers/diaryController.js
import Diary from '../models/diary';
import { validationResult } from 'express-validator';

const submitDiaryEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content, rating } = req.body;
  const { share } = req.query;
  const isShared = share === 'true';
  const userId = req.user.id;

  try {
    // 5분 제한 로직 구현
    const lastEntryTime = await Diary.getLastEntryTime(userId);
    if (lastEntryTime) {
      const timeSinceLastEntry = Date.now() - new Date(lastEntryTime).getTime();
      const fiveMinutesInMs = 5 * 60 * 1000; // 5분을 밀리초로 변환
      
      if (timeSinceLastEntry < fiveMinutesInMs) {
        const remainingTime = Math.ceil((fiveMinutesInMs - timeSinceLastEntry) / 1000);
        return res.status(429).json({ 
          message: '5분이 지나지 않았습니다. 다시 시도해주세요.',
          remainingSeconds: remainingTime
        });
      }
    }

    const newEntry = await Diary.createDiaryEntry(userId, content, isShared, rating);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error submitting diary entry:', error);
    res.status(500).json({ message: 'Failed to submit diary entry' });
  }
};

const getSharedEntries = async (req, res) => {
  try {
    const sharedEntries = await Diary.getSharedEntries();
    res.status(200).json(sharedEntries);
  } catch (error) {
    console.error('Error fetching shared entries:', error);
    res.status(500).json({ message: 'Failed to fetch shared entries' });
  }
};

export default { submitDiaryEntry, getSharedEntries };