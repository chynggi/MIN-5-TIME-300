import pkg from 'pg';
const { Pool } = pkg;
import pool from '../db.js';

class CommunityPost {
  static async createPost(userId, title, content) {
    try {
      const result = await pool.query(
        'INSERT INTO community_posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING id, title, content, user_id, created_at, updated_at',
        [userId, title, content]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  static async getPosts(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await pool.query(
        `SELECT cp.id, cp.title, cp.content, cp.created_at, cp.updated_at, cp.view_count, 
         u.username, u.profile_image,
         COUNT(cc.id) as comment_count
         FROM community_posts cp
         JOIN users u ON cp.user_id = u.id
         LEFT JOIN community_comments cc ON cp.id = cc.post_id
         GROUP BY cp.id, u.username, u.profile_image
         ORDER BY cp.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      const countResult = await pool.query('SELECT COUNT(*) FROM community_posts');
      const totalPosts = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalPosts / limit);
      
      return {
        posts: result.rows,
        pagination: {
          total: totalPosts,
          totalPages,
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  static async getPostById(postId) {
    try {
      // 조회수 증가
      await pool.query(
        'UPDATE community_posts SET view_count = view_count + 1 WHERE id = $1',
        [postId]
      );
      
      const result = await pool.query(
        `SELECT cp.id, cp.title, cp.content, cp.created_at, cp.updated_at, cp.view_count, cp.user_id,
         u.username, u.profile_image
         FROM community_posts cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.id = $1`,
        [postId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching post by id:', error);
      throw error;
    }
  }

  static async updatePost(postId, userId, title, content) {
    try {
      const result = await pool.query(
        `UPDATE community_posts 
         SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND user_id = $4
         RETURNING id, title, content, user_id, created_at, updated_at`,
        [title, content, postId, userId]
      );
      
      if (result.rows.length === 0) {
        return null; // 게시글이 존재하지 않거나 사용자가 작성자가 아님
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  static async deletePost(postId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM community_posts WHERE id = $1 AND user_id = $2 RETURNING id',
        [postId, userId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
  
  static async getComments(postId) {
    try {
      const result = await pool.query(
        `SELECT cc.id, cc.content, cc.created_at, cc.user_id,
         u.username, u.profile_image
         FROM community_comments cc
         JOIN users u ON cc.user_id = u.id
         WHERE cc.post_id = $1
         ORDER BY cc.created_at ASC`,
        [postId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }
  
  static async addComment(postId, userId, content) {
    try {
      const result = await pool.query(
        `INSERT INTO community_comments (post_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, content, created_at`,
        [postId, userId, content]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
}

export default CommunityPost;