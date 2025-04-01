import pool from '../db.js';

class Admin {
  // 시스템 통계 가져오기
  static async getSystemStats() {
    try {
      // 사용자 수 조회
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      
      // 전체 일기 수 조회
      const diaryCount = await pool.query('SELECT COUNT(*) FROM diaries');
      
      // 공개 일기 수 조회
      const sharedDiaryCount = await pool.query('SELECT COUNT(*) FROM diaries WHERE is_shared = true');
      
      // 커뮤니티 게시글 수 조회
      const postCount = await pool.query('SELECT COUNT(*) FROM community_posts');
      
      // 댓글 수 조회
      const commentCount = await pool.query('SELECT COUNT(*) FROM comments');
      
      return {
        users: parseInt(userCount.rows[0].count),
        diaries: {
          total: parseInt(diaryCount.rows[0].count),
          shared: parseInt(sharedDiaryCount.rows[0].count),
          private: parseInt(diaryCount.rows[0].count) - parseInt(sharedDiaryCount.rows[0].count)
        },
        posts: parseInt(postCount.rows[0].count),
        comments: parseInt(commentCount.rows[0].count)
      };
    } catch (error) {
      console.error('시스템 통계 조회 중 오류:', error);
      throw error;
    }
  }
  
  // MBTI별 사용자 분포 조회
  static async getMbtiDistribution() {
    try {
      const result = await pool.query(`
        SELECT mbti, COUNT(*) as count 
        FROM users 
        WHERE mbti IS NOT NULL 
        GROUP BY mbti 
        ORDER BY count DESC
      `);
      
      return result.rows;
    } catch (error) {
      console.error('MBTI 분포 조회 중 오류:', error);
      throw error;
    }
  }
  
  // 최근 가입 사용자 목록 조회
  static async getRecentUsers(limit = 10) {
    try {
      const result = await pool.query(`
        SELECT id, username, email, mbti, profile_image, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      console.error('최근 사용자 조회 중 오류:', error);
      throw error;
    }
  }
  
  // 일일 활동 통계 조회
  static async getDailyActivityStats(days = 7) {
    try {
      // 최근 n일간의 새 일기 수
      const diaryStats = await pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM diaries
        WHERE created_at >= CURRENT_DATE - INTERVAL '$1 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [days]);
      
      // 최근 n일간의 새 사용자 수
      const userStats = await pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '$1 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [days]);
      
      return {
        diaries: diaryStats.rows,
        users: userStats.rows
      };
    } catch (error) {
      console.error('일일 활동 통계 조회 중 오류:', error);
      throw error;
    }
  }
}

export default Admin;