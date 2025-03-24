// models/question.js
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool();

class Question {
  static async getDailyQuestion() {
    const countResult = await pool.query('SELECT COUNT(*) FROM questions');
    const count = parseInt(countResult.rows[0].count);
    if (count === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * count);
    const result = await pool.query('SELECT * FROM questions OFFSET $1 LIMIT 1', [randomIndex]);
    return result.rows[0];
  }

  static async addQuestion(question) {
    const result = await pool.query('INSERT INTO questions (question) VALUES ($1) RETURNING id, question', [question]);
    return result.rows[0];
  }
}

export default Question;