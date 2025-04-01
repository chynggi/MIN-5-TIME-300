import * as recommendedQuestion from '../models/recommendations/recommendedQuestion.js';
import * as questionVote from '../models/recommendations/questionVote.js';
import * as questionComment from '../models/recommendations/questionComment.js';
import * as questionCategory from '../models/recommendations/questionCategory.js';

// 추천 질문 생성
export async function createQuestion(req, res) {
  try {
    const { question_text, description, category } = req.body;
    const user_id = req.user.id; // JWT 토큰에서 파싱된 사용자 ID
    
    if (!question_text) {
      return res.status(400).json({ error: '질문 내용은 필수입니다.' });
    }
    
    const newQuestion = await recommendedQuestion.createRecommendedQuestion(
      user_id, 
      question_text, 
      description, 
      category
    );
    
    return res.status(201).json({
      success: true,
      message: '질문이 성공적으로 제안되었습니다.',
      data: newQuestion
    });
  } catch (error) {
    console.error('질문 생성 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 모든 추천 질문 조회 (페이지네이션, 필터링 지원)
export async function getAllQuestions(req, res) {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    const questions = await recommendedQuestion.getAllRecommendedQuestions(
      status, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    return res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('질문 목록 조회 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 단일 추천 질문 조회 (댓글 포함)
export async function getQuestionById(req, res) {
  try {
    const { id } = req.params;
    
    // 질문 정보 조회
    const question = await recommendedQuestion.getRecommendedQuestionById(id);
    
    if (!question) {
      return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
    }
    
    // 댓글 정보 조회
    const comments = await questionComment.getCommentsByQuestionId(id);
    
    // 현재 사용자의 투표 정보 조회 (로그인한 경우)
    let userVote = null;
    if (req.user) {
      userVote = await questionVote.getUserVote(id, req.user.id);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        question,
        comments,
        userVote: userVote ? userVote.vote_type : null
      }
    });
  } catch (error) {
    console.error('질문 조회 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 질문 수정 (작성자만 가능)
export async function updateQuestion(req, res) {
  try {
    const { id } = req.params;
    const { question_text, description, category } = req.body;
    const userId = req.user.id;
    
    // 질문 조회
    const question = await recommendedQuestion.getRecommendedQuestionById(id);
    
    if (!question) {
      return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
    }
    
    // 작성자 확인
    if (question.user_id !== userId) {
      return res.status(403).json({ error: '이 질문을 수정할 권한이 없습니다.' });
    }
    
    // 승인된 질문은 수정 불가
    if (question.status === 'approved') {
      return res.status(400).json({ error: '승인된 질문은 수정할 수 없습니다.' });
    }
    
    // 질문 수정
    const updatedQuestion = await recommendedQuestion.updateRecommendedQuestion(
      id, 
      question_text || question.question_text, 
      description !== undefined ? description : question.description,
      category !== undefined ? category : question.category
    );
    
    return res.status(200).json({
      success: true,
      message: '질문이 성공적으로 수정되었습니다.',
      data: updatedQuestion
    });
  } catch (error) {
    console.error('질문 수정 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 질문 삭제 (작성자 또는 관리자만 가능)
export async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // 질문 조회
    const question = await recommendedQuestion.getRecommendedQuestionById(id);
    
    if (!question) {
      return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
    }
    
    // 권한 확인
    if (question.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: '이 질문을 삭제할 권한이 없습니다.' });
    }
    
    // 질문 삭제
    await recommendedQuestion.deleteRecommendedQuestion(id);
    
    return res.status(200).json({
      success: true,
      message: '질문이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('질문 삭제 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 질문 상태 업데이트 (관리자만 가능)
export async function updateQuestionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '관리자만 질문 상태를 변경할 수 있습니다.' });
    }
    
    // 유효한 상태값인지 확인
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '유효하지 않은 상태값입니다.' });
    }
    
    // 상태 업데이트
    const updatedQuestion = await recommendedQuestion.updateQuestionStatus(id, status);
    
    if (!updatedQuestion) {
      return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
    }
    
    return res.status(200).json({
      success: true,
      message: `질문 상태가 ${status}로 업데이트되었습니다.`,
      data: updatedQuestion
    });
  } catch (error) {
    console.error('질문 상태 업데이트 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}