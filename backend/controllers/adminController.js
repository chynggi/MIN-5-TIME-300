import Admin from '../models/admin.js';

// 시스템 통계 조회
export const getSystemStats = async (req, res) => {
  try {
    const stats = await Admin.getSystemStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('시스템 통계 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// MBTI 분포 조회
export const getMbtiDistribution = async (req, res) => {
  try {
    const distribution = await Admin.getMbtiDistribution();
    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('MBTI 분포 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 최근 가입 사용자 목록 조회
export const getRecentUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const users = await Admin.getRecentUsers(parseInt(limit));
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('최근 사용자 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 일일 활동 통계 조회
export const getDailyActivityStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await Admin.getDailyActivityStats(parseInt(days));
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('일일 활동 통계 조회 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 관리자 권한 확인 미들웨어
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '관리자 권한이 필요합니다.'
      });
    }
    next();
  } catch (error) {
    console.error('관리자 권한 확인 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};