// models/diary.js
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool();

class Diary {
  static async createDiaryEntry(userId, content, isShared, rating) {
    const result = await pool.query(
      'INSERT INTO diaries (user_id, content, is_shared, rating) VALUES ($1, $2, $3, $4) RETURNING id, content, is_shared, rating, created_at',
      [userId, content, isShared, rating]
    );
    return result.rows[0];
  }

  static async getSharedEntries() {
    const result = await pool.query(
      'SELECT d.id, d.content, d.rating, d.created_at, u.username ' +
      'FROM diaries d JOIN users u ON d.user_id = u.id WHERE d.is_shared = TRUE'
    );
    return result.rows;
  }
  static async getUserEntries(userId) {
    const result = await pool.query(
      'SELECT id, content, is_shared, rating, created_at FROM diaries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async getDiaryEntry(id, userId) {
    const result = await pool.query(
      'SELECT id, content, is_shared, rating, created_at FROM diaries WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  }

  static async updateDiaryEntry(id, userId, content, isShared, rating) {
    const result = await pool.query(
      'UPDATE diaries SET content = $1, is_shared = $2, rating = $3 WHERE id = $4 AND user_id = $5 RETURNING id, content, is_shared, rating, created_at',
      [content, isShared, rating, id, userId]
    );
    return result.rows[0];
  }

  static async deleteDiaryEntry(id, userId) {
    const result = await pool.query(
      'DELETE FROM diaries WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  }

  static async getLastEntryTime(userId) {
    const result = await pool.query(
      'SELECT created_at FROM diaries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0]?.created_at;
  }

  // You might want to add more methods for fetching user-specific entries later
}

export default Diary;