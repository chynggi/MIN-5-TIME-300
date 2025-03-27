import bcrypt from 'bcrypt';
import pool from '../db.js';
import fs from 'fs';
import path from 'path';

// 프로필 조회
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT id, email, name, bio, profile_image_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 프로필 정보 업데이트
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = $1, bio = $2 WHERE id = $3 RETURNING id, email, name, bio, profile_image_url',
      [name, bio, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// updateProfileImage 함수 수정

export const updateProfileImage = async (req, res) => {
  try {
    // 파일이 없는 경우 확인
    if (!req.file) {
      return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }
    
    // 현재 사용 중인 칼럼명으로 수정 (profile_image_url → profile_image)
    const result = await pool.query(
      'UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING id, profile_image',
      [req.file.filename, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json({
      message: '프로필 이미지가 업데이트되었습니다.',
      imageUrl: req.file.filename // 응답에서도 맞는 필드명 사용
    });
  } catch (error) {
    console.error('프로필 이미지 업데이트 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 비밀번호 변경
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current, new: newPassword } = req.body;

    // 현재 비밀번호 확인
    const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    
    if (!user.rows.length) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const isMatch = await bcrypt.compare(current, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 새 비밀번호 해시화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 비밀번호 업데이트
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};