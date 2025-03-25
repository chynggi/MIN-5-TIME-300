// models/user.js
import bcrypt from 'bcrypt';
import pool from '../db.js';

class User {
  static async createUser(username, password, mbti = null, profileImage = null) {
    try {
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
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
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
      throw error;
    }
  }
}

export default User;