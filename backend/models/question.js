// models/question.js
import pkg from 'pg';
import config from '../config/config.js';

const { Pool } = pkg;
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: String(config.database.password),
  database: config.database.database
});

class Question {
  static async getDailyQuestion() {
    try {
      const countResult = await pool.query('SELECT COUNT(*) FROM questions');
      const count = parseInt(countResult.rows[0].count);
      if (count === 0) {
        return null;
      }
      const randomIndex = Math.floor(Math.random() * count);
      const result = await pool.query('SELECT * FROM questions OFFSET $1 LIMIT 1', [randomIndex]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in getDailyQuestion:', error);
      throw error;
    }
  }

  static async getDailyQuestions() {
    try {
      const countResult = await pool.query('SELECT COUNT(*) FROM questions');
      const count = parseInt(countResult.rows[0].count);
      if (count === 0) {
        return [];
      }
      // ORDER BY RANDOM()을 사용하여 랜덤하게 5개의 질문을 선택
      const result = await pool.query('SELECT * FROM questions ORDER BY RANDOM() LIMIT 5');
      return result.rows;
    } catch (error) {
      console.error('Error in getDailyQuestions:', error);
      throw error;
    }
  }

  static async addQuestion(question) {
    try {
      const result = await pool.query('INSERT INTO questions (question) VALUES ($1) RETURNING id, question', [question]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in addQuestion:', error);
      throw error;
    }
  }
}

export default Question;