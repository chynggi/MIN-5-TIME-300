import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';

export const profileImageUploadOptions: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, callback) => {
    // 이미지 파일만 허용
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          '지원되지 않는 파일 형식입니다. JPEG, PNG, WebP 파일만 업로드 가능합니다.',
        ),
        false,
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
    // 이미지, 동영상, 오디오 파일 허용 (음성 메시지는 MP3 업로드)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/mp3',
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          '지원되지 않는 파일 형식입니다. 이미지, 동영상 또는 음성 파일만 업로드 가능합니다.',
        ),
        false,
      );
    }

    callback(null, true);
  },
};
