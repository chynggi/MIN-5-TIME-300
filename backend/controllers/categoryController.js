import * as questionCategory from '../models/recommendations/questionCategory.js';

// 카테고리 생성 (관리자만 가능)
export async function createCategory(req, res) {
  try {
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '관리자만 카테고리를 생성할 수 있습니다.' });
    }
    
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '카테고리 이름은 필수입니다.' });
    }
    
    const newCategory = await questionCategory.createCategory(name, description);
    
    return res.status(201).json({
      success: true,
      message: '카테고리가 성공적으로 생성되었습니다.',
      data: newCategory
    });
  } catch (error) {
    // 중복 카테고리 이름 처리
    if (error.code === '23505') {
      return res.status(400).json({ error: '이미 존재하는 카테고리 이름입니다.' });
    }
    
    console.error('카테고리 생성 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 모든 카테고리 조회
export async function getAllCategories(req, res) {
  try {
    const categories = await questionCategory.getAllCategories();
    
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('카테고리 조회 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 카테고리 수정 (관리자만 가능)
export async function updateCategory(req, res) {
  try {
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '관리자만 카테고리를 수정할 수 있습니다.' });
    }
    
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: '카테고리 이름은 필수입니다.' });
    }
    
    const updatedCategory = await questionCategory.updateCategory(id, name, description);
    
    if (!updatedCategory) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }
    
    return res.status(200).json({
      success: true,
      message: '카테고리가 성공적으로 수정되었습니다.',
      data: updatedCategory
    });
  } catch (error) {
    // 중복 카테고리 이름 처리
    if (error.code === '23505') {
      return res.status(400).json({ error: '이미 존재하는 카테고리 이름입니다.' });
    }
    
    console.error('카테고리 수정 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

// 카테고리 삭제 (관리자만 가능)
export async function deleteCategory(req, res) {
  try {
    // 관리자 권한 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '관리자만 카테고리를 삭제할 수 있습니다.' });
    }
    
    const { id } = req.params;
    
    const success = await questionCategory.deleteCategory(id);
    
    if (!success) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }
    
    return res.status(200).json({
      success: true,
      message: '카테고리가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('카테고리 삭제 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}