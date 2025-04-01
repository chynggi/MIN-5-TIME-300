import pool from '../../db.js';

// 질문에 투표하기
export async function voteQuestion(questionId, userId, voteType) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 기존 투표 확인
    const existingVote = await client.query(
      'SELECT * FROM question_votes WHERE question_id = $1 AND user_id = $2',
      [questionId, userId]
    );
    
    let result;
    if (existingVote.rows.length > 0) {
      if (existingVote.rows[0].vote_type === voteType) {
        // 같은 투표 타입이면 투표 취소
        await client.query(
          'DELETE FROM question_votes WHERE question_id = $1 AND user_id = $2',
          [questionId, userId]
        );
        
        // 투표 수 업데이트
        if (voteType === 'upvote') {
          await client.query(
            'UPDATE recommended_questions SET upvotes = upvotes - 1 WHERE id = $1',
            [questionId]
          );
        } else {
          await client.query(
            'UPDATE recommended_questions SET downvotes = downvotes - 1 WHERE id = $1',
            [questionId]
          );
        }
        
        result = { action: 'removed', voteType };
      } else {
        // 다른 투표 타입이면 투표 변경
        await client.query(
          'UPDATE question_votes SET vote_type = $1 WHERE question_id = $2 AND user_id = $3',
          [voteType, questionId, userId]
        );
        
        // 투표 수 업데이트
        if (voteType === 'upvote') {
          await client.query(
            'UPDATE recommended_questions SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = $1',
            [questionId]
          );
        } else {
          await client.query(
            'UPDATE recommended_questions SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = $1',
            [questionId]
          );
        }
        
        result = { action: 'changed', voteType };
      }
    } else {
      // 새로운 투표
      await client.query(
        'INSERT INTO question_votes (question_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [questionId, userId, voteType]
      );
      
      // 투표 수 업데이트
      if (voteType === 'upvote') {
        await client.query(
          'UPDATE recommended_questions SET upvotes = upvotes + 1 WHERE id = $1',
          [questionId]
        );
      } else {
        await client.query(
          'UPDATE recommended_questions SET downvotes = downvotes + 1 WHERE id = $1',
          [questionId]
        );
      }
      
      result = { action: 'added', voteType };
    }
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('질문 투표 중 오류:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 사용자의 질문에 대한 투표 확인
export async function getUserVote(questionId, userId) {
  try {
    const result = await pool.query(
      'SELECT vote_type FROM question_votes WHERE question_id = $1 AND user_id = $2',
      [questionId, userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('투표 확인 중 오류:', error);
    throw error;
  }
}