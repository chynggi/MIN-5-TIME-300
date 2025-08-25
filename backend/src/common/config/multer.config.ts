import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';

export const profileImageUploadOptions: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, callback) => {
    // 이미지 파일만 허용
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException('지원되지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드 가능합니다.'),
        false
      );
    }
    
    callback(null, true);
  },
};

export const diaryMediaUploadOptions: MulterOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, callback) => {
    // 이미지 및 동영상 파일 허용
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException('지원되지 않는 파일 형식입니다. 이미지 또는 동영상 파일만 업로드 가능합니다.'),
        false
      );
    }
    
    callback(null, true);
  },
};