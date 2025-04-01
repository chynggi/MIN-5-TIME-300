import * as questionComment from '../models/recommendations/QuestionComment.js';
import * as recommendedQuestion from '../models/recommendations/RecommendedQuestion.js';

// 댓글 작성
export async function createComment(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: '댓글 내용은 필수입니다.' });
    }
    
    // 질문 존재 확인
    const question = await recommendedQuestion.getRecommendedQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
    }
    
    // 댓글 저장
    const newComment = await questionComment.createComment(id, userId, comment);
    
    // 사용자 정보 추가
    newComment.username = req.user.username;
    newComment.profile_image = req.user.profile_image;
    
    return res.status(201).json({
      success: true,
      message: '댓글이 성공적으로 작성되었습니다.',
      data: newComment
    });
  } catch (error) {
    console.error('댓글 작성 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 질문의 모든 댓글 조회
export async function getQuestionComments(req, res) {
  try {
    const { id } = req.params;
    
    // 질문 존재 확인
    const question = await recommendedQuestion.getRecommendedQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
    }
    
    // 댓글 조회
    const comments = await questionComment.getCommentsByQuestionId(id);
    
    return res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('댓글 조회 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 댓글 수정
export async function updateComment(req, res) {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: '댓글 내용은 필수입니다.' });
    }
    
    // 댓글 수정
    const updatedComment = await questionComment.updateComment(commentId, userId, comment);
    
    if (!updatedComment) {
      return res.status(404).json({ 
        error: '댓글을 찾을 수 없거나 수정 권한이 없습니다.' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '댓글이 성공적으로 수정되었습니다.',
      data: updatedComment
    });
  } catch (error) {
    console.error('댓글 수정 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 댓글 삭제
export async function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // 댓글 삭제 (작성자 또는 관리자만 가능)
    const success = await questionComment.deleteComment(commentId, isAdmin ? null : userId);
    
    if (!success) {
      return res.status(404).json({ 
        error: '댓글을 찾을 수 없거나 삭제 권한이 없습니다.' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '댓글이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('댓글 삭제 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}