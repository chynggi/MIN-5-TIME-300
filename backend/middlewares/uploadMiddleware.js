import multer from 'multer';
import path from 'path';
import { uploadConfig } from '../config/uploadConfig.js';

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 임시 저장소에 먼저 저장
    cb(null, uploadConfig.tempDir);
  },
  filename: function (req, file, cb) {
    // 파일명 생성: timestamp-random-originalExtension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// 파일 필터링
const fileFilter = (req, file, cb) => {
  // 허용되는 이미지 타입
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다. (jpeg, png, gif, webp만 허용)'), false);
  }
};

export const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: uploadConfig.maxSize // 설정된 최대 크기 사용
  }
}); 