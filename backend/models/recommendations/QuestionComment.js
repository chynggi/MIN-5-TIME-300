import pool from '../../db.js';

// 댓글 작성
export async function createComment(questionId, userId, comment) {
  try {
    const result = await pool.query(
      `INSERT INTO question_comments (question_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [questionId, userId, comment]
    );
    return result.rows[0];
  } catch (error) {
    console.error('댓글 작성 중 오류:', error);
    throw error;
  }
}

// 질문에 대한 모든 댓글 조회
export async function getCommentsByQuestionId(questionId) {
  try {
    const result = await pool.query(
      `SELECT qc.*, u.username, u.profile_image
       FROM question_comments qc
       JOIN users u ON qc.user_id = u.id
       WHERE qc.question_id = $1
       ORDER BY qc.created_at ASC`,
      [questionId]
    );
    return result.rows;
  } catch (error) {
    console.error('댓글 조회 중 오류:', error);
    throw error;
  }
}

// 댓글 수정
export async function updateComment(commentId, userId, comment) {
  try {
    const result = await pool.query(
      `UPDATE question_comments
       SET comment = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [comment, commentId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('댓글 수정 중 오류:', error);
    throw error;
  }
}

// 댓글 삭제
export async function deleteComment(commentId, userId) {
  try {
    await pool.query(
      'DELETE FROM question_comments WHERE id = $1 AND user_id = $2',
      [commentId, userId]
    );
    return true;
  } catch (error) {
    console.error('댓글 삭제 중 오류:', error);
    throw error;
  }
}