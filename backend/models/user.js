// models/user.js
import bcrypt from 'bcrypt';
import pool from '../db.js';

class User {
  static async createUser(username, password, mbti = null, profileImage = null) {
    try {
      // 입력 유효성 검사
      if (!username || username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (mbti && !['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'].includes(mbti)) {
        throw new Error('Invalid MBTI type');
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (username, password, mbti, profile_image, created_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
         RETURNING id, username, mbti, profile_image, created_at`,
        [username, hashedPassword, mbti, profileImage]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  static async findByUsername(username) {
    try {
      const result = await pool.query(
        'SELECT id, username, mbti, created_at, profile_image, password FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByUsername:', error);
      // 구체적인 에러 정보 노출 방지
      throw new Error('Database error occurred');
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT id, username, mbti, created_at, profile_image FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in findById:', error);
      throw new Error('Unable to retrieve user information');
    }
  }

  static async usernameExists(username) {
    try {
      const result = await pool.query(
        'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) as exists',
        [username]
      );
      return result.rows[0].exists;
    } catch (error) {
      console.error('Error checking username existence:', error);
      throw new Error('Database error occurred');
    }
  }

  static async updateLoginAttempts(username, reset = false) {
    try {
      if (reset) {
        await pool.query(
          'UPDATE users SET login_attempts = 0, last_login_attempt = CURRENT_TIMESTAMP WHERE username = $1',
          [username]
        );
      } else {
        await pool.query(
          'UPDATE users SET login_attempts = login_attempts + 1, last_login_attempt = CURRENT_TIMESTAMP WHERE username = $1',
          [username]
        );
      }
    } catch (error) {
      console.error('Error updating login attempts:', error);
      throw new Error('Failed to update login security information');
    }
  }

  static async updateUser(id, updates) {
    try {
      const allowedUpdates = ['mbti', 'profile_image'];
      const setClause = [];
      const values = [];
      let paramCounter = 1;
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          setClause.push(`${key} = $${paramCounter}`);
          values.push(updates[key]);
          paramCounter++;
        }
      });
      
      if (setClause.length === 0) {
        return null; // 업데이트할 내용이 없음
      }
      
      values.push(id);
      const query = `
        UPDATE users 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, username, mbti, created_at, profile_image
      `;
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user information');
    }
  }
}

export default User;