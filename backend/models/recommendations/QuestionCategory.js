import pool from '../../db.js';

// 카테고리 생성
export async function createCategory(name, description) {
  try {
    const result = await pool.query(
      `INSERT INTO question_categories (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description]
    );
    return result.rows[0];
  } catch (error) {
    console.error('카테고리 생성 중 오류:', error);
    throw error;
  }
}

// 모든 카테고리 조회
export async function getAllCategories() {
  try {
    const result = await pool.query('SELECT * FROM question_categories ORDER BY name');
    return result.rows;
  } catch (error) {
    console.error('카테고리 조회 중 오류:', error);
    throw error;
  }
}

// 카테고리 수정
export async function updateCategory(id, name, description) {
  try {
    const result = await pool.query(
      `UPDATE question_categories
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('카테고리 수정 중 오류:', error);
    throw error;
  }
}

// 카테고리 삭제
export async function deleteCategory(id) {
  try {
    await pool.query('DELETE FROM question_categories WHERE id = $1', [id]);
    return true;
  } catch (error) {
    console.error('카테고리 삭제 중 오류:', error);
    throw error;
  }
}