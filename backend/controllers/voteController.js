import * as questionVote from '../models/recommendations/questionVote.js';
import * as recommendedQuestion from '../models/recommendations/recommendedQuestion.js';

// 질문에 투표하기
export async function voteForQuestion(req, res) {
  try {
    const { id } = req.params;
    const { vote_type } = req.body;
    const userId = req.user.id;
    
    // 유효한 투표 타입인지 확인
    if (!['upvote', 'downvote'].includes(vote_type)) {
      return res.status(400).json({ error: '유효하지 않은 투표 타입입니다.' });
    }
    
    // 질문 존재 확인
    const question = await recommendedQuestion.getRecommendedQuestionById(id);
    if (!question) {
      return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
    }
    
    // 자신의 질문에는 투표 불가
    if (question.user_id === userId) {
      return res.status(400).json({ error: '자신의 질문에는 투표할 수 없습니다.' });
    }
    
    // 투표 처리
    const result = await questionVote.voteQuestion(id, userId, vote_type);
    
    // 최신 질문 정보 조회
    const updatedQuestion = await recommendedQuestion.getRecommendedQuestionById(id);
    
    return res.status(200).json({
      success: true,
      message: `질문에 ${result.action === 'removed' ? '투표가 취소' : '투표'}되었습니다.`,
      data: {
        action: result.action,
        vote_type: result.voteType,
        question: updatedQuestion
      }
    });
  } catch (error) {
    console.error('투표 처리 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 사용자의 투표 상태 확인
export async function getUserVoteStatus(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const userVote = await questionVote.getUserVote(id, userId);
    
    return res.status(200).json({
      success: true,
      data: {
        vote_type: userVote ? userVote.vote_type : null
      }
    });
  } catch (error) {
    console.error('투표 상태 조회 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}