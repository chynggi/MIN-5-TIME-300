import express from 'express';
import Diary from '../models/diary.js';
import { auth } from '../middlewares/authMiddleware.js'; // named import로 수정
import pool from '../db.js';
const router = express.Router();

// 일기 목록 조회 - auth 미들웨어 추가
router.get('/diaries', auth, async (req, res) => {
  try {
    const userId = req.user.id; // 인증된 사용자 ID
    const entries = await Diary.getUserEntries(userId);
    res.json(entries);
  } catch (error) {
    console.error('일기 목록 조회 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 일기 작성 - auth 미들웨어 추가
router.post('/diaries', auth, async (req, res) => {
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

// 댓글 작성에 트랜잭션 적용
router.post('/entries/:id/comments', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { content } = req.body;
    const { id } = req.params;
    
    // 일기 존재 여부 확인
    const diary = await client.query(
      'SELECT * FROM diaries WHERE id = $1',
      [id]
    );
    
    if (diary.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: '일기를 찾을 수 없습니다.' });
    }
    
    const comment = await client.query(
      `INSERT INTO comments (content, user_id, diary_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, content, created_at`,
      [content, req.user.id, id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      id: comment.rows[0].id,
      content: comment.rows[0].content,
      createdAt: comment.rows[0].created_at,
      author: {
        id: req.user.id,
        username: req.user.username,
        profileImage: req.user.profile_image
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('댓글 작성 중 오류:', error);
    res.status(500).json({ message: '댓글 작성 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 좋아요 기능에 트랜잭션 적용
router.post('/entries/:id/like', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    
    // 좋아요 토글 기능 추가
    const existingLike = await client.query(
      'SELECT * FROM likes WHERE user_id = $1 AND diary_id = $2',
      [req.user.id, id]
    );
    
    if (existingLike.rows.length > 0) {
      // 이미 좋아요가 있으면 삭제 (토글)
      await client.query(
        'DELETE FROM likes WHERE user_id = $1 AND diary_id = $2',
        [req.user.id, id]
      );
    } else {
      // 좋아요가 없으면 추가
      await client.query(
        'INSERT INTO likes (user_id, diary_id) VALUES ($1, $2)',
        [req.user.id, id]
      );
    }
    
    // 최신 좋아요 정보 반환
    const likeCount = await client.query(
      'SELECT COUNT(*) FROM likes WHERE diary_id = $1',
      [id]
    );

    await client.query('COMMIT');
    
    res.status(200).json({ 
      likes: parseInt(likeCount.rows[0].count),
      isLiked: existingLike.rows.length === 0
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('좋아요 처리 중 오류:', error);
    res.status(500).json({ message: '좋아요 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// 공유된 일기 목록 조회
router.get('/shared-entries', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    const entries = await pool.query(
      `SELECT d.*, u.username, u.profile_image, 
       COUNT(DISTINCT l.id) as likes,
       COUNT(DISTINCT c.id) as comment_count,
       EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND diary_id = d.id) as is_liked
       FROM diaries d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN likes l ON d.id = l.diary_id
       LEFT JOIN comments c ON d.id = c.diary_id
       WHERE d.is_shared = true
       GROUP BY d.id, u.id, u.username, u.profile_image
       ORDER BY d.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    
    res.json(entries.rows);
  } catch (error) {
    console.error('공유된 일기 목록 조회 중 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 댓글 삭제에 트랜잭션 적용
router.delete('/entries/:entryId/comments/:commentId', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { entryId, commentId } = req.params;
    
    // 댓글 작성자 확인
    const comment = await client.query(
      'SELECT * FROM comments WHERE id = $1',
      [commentId]
    );
    
    if (comment.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }
    
    if (comment.rows[0].user_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: '댓글 삭제 권한이 없습니다.' });
    }
    
    await client.query(
      'DELETE FROM comments WHERE id = $1',
      [commentId]
    );
    
    await client.query('COMMIT');
    res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('댓글 삭제 중 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

export default router;