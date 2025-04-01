import pool from '../../db.js';

// 추천 질문 생성
export async function createRecommendedQuestion(userId, questionText, description, category = null) {
  try {
    const result = await pool.query(
      `INSERT INTO recommended_questions (user_id, question_text, description, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, questionText, description, category]
    );
    return result.rows[0];
  } catch (error) {
    console.error('추천 질문 생성 중 오류:', error);
    throw error;
  }
}

// 모든 추천 질문 조회
export async function getAllRecommendedQuestions(status = null, limit = 20, offset = 0) {
  try {
    let query = `
      SELECT rq.*, u.username, 
             (SELECT COUNT(*) FROM question_comments WHERE question_id = rq.id) AS comment_count
      FROM recommended_questions rq
      JOIN users u ON rq.user_id = u.id
    `;
    
    const values = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` WHERE rq.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }
    
    query += ` ORDER BY rq.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('추천 질문 조회 중 오류:', error);
    throw error;
  }
}

// 질문 ID로 단일 질문 조회
export async function getRecommendedQuestionById(questionId) {
  try {
    const result = await pool.query(
      `SELECT rq.*, u.username 
       FROM recommended_questions rq
       JOIN users u ON rq.user_id = u.id
       WHERE rq.id = $1`,
      [questionId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('추천 질문 조회 중 오류:', error);
    throw error;
  }
}

// 질문 상태 업데이트 (관리자용)
export async function updateQuestionStatus(questionId, status) {
  try {
    const result = await pool.query(
      `UPDATE recommended_questions
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, questionId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('질문 상태 업데이트 중 오류:', error);
    throw error;
  }
}

// 질문 수정
export async function updateRecommendedQuestion(questionId, questionText, description, category) {
  try {
    const result = await pool.query(
      `UPDATE recommended_questions
       SET question_text = $1, description = $2, category = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [questionText, description, category, questionId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('추천 질문 수정 중 오류:', error);
    throw error;
  }
}

// 질문 삭제
export async function deleteRecommendedQuestion(questionId) {
  try {
    await pool.query('DELETE FROM recommended_questions WHERE id = $1', [questionId]);
    return true;
  } catch (error) {
    console.error('추천 질문 삭제 중 오류:', error);
    throw error;
  }
}