import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { BaseService } from '../logger/base.service';

@Injectable()
export class FileUploadService extends BaseService {
  private readonly uploadRootPath = join(
    __dirname,
    '..',
    '..',
    '..',
    'uploads',
  );

  constructor() {
    super(FileUploadService.name);
  }

  /**
   * 안전한 파일 업로드
   * @param file 업로드할 파일
   * @param uploadPath 업로드 경로 (uploads 폴더 기준)
   * @param allowedTypes 허용된 MIME 타입 배열
   * @param maxSize 최대 파일 크기 (바이트)
   * @returns 업로드된 파일의 URL
   */
  async uploadFile(
    file: any,
    uploadPath: string,
    allowedTypes: string[],
    maxSize: number,
  ): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // MIME 타입 검증
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `지원되지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`,
      );
    }

    // 파일 크기 검증
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(
        `파일 크기가 너무 큽니다. 최대 ${maxSizeMB}MB까지 업로드 가능합니다.`,
      );
    }

    try {
      // 업로드 디렉토리 생성
      const uploadDir = join(this.uploadRootPath, uploadPath);
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // 안전한 파일명 생성 (UUID + 원본 확장자)
      const fileExtension = extname(file.originalname);
      const safeFileName = `${randomUUID()}${fileExtension}`;
      const filePath = join(uploadDir, safeFileName);

      // 파일 저장 (메모리/디스크 스토리지 모두 지원)
      const fileContent = file.buffer
        ? file.buffer
        : file.path && existsSync(file.path)
          ? readFileSync(file.path)
          : null;

      if (!fileContent) {
        throw new BadRequestException('파일 데이터를 읽을 수 없습니다.');
      }

      writeFileSync(filePath, fileContent);

      // 파일 URL 생성
      const fileUrl = `/uploads/${uploadPath}/${safeFileName}`;

      return {
        fileUrl,
        fileName: safeFileName,
        fileSize: file.size,
      };
    } catch (error: any) {
      this.logger.error(`파일 업로드 오류: ${error?.message}`);
      throw new BadRequestException('파일 업로드 중 오류가 발생했습니다.');
    }
  }

  /**
   * 파일 삭제
   * @param fileUrl 삭제할 파일의 URL
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl) return;

      // 절대 URL인 경우 origin 제거 후 상대 경로만 사용 (쿼리/해시 제외)
      const normalizedUrl = fileUrl
        .replace(/^https?:\/\/[^/]+/i, '')
        .split(/[?#]/)[0];

      if (!normalizedUrl.startsWith('/uploads/')) {
        return;
      }

      const relativePath = normalizedUrl.replace('/uploads/', '');
      const safeRelativePath = relativePath.replace(/\.\.(?:\/?|\\?)/g, '');
      const filePath = join(this.uploadRootPath, safeRelativePath);

      // 파일이 존재하면 삭제
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error: any) {
      this.logger.warn(`파일 삭제 오류: ${error?.message}`);
      // 파일 삭제 실패는 중요하지 않으므로 에러를 던지지 않음
    }
  }

  /**
   * 파일 타입별 설정 반환
   */
  getUploadConfig(type: 'profile' | 'diary'): {
    allowedTypes: string[];
    maxSize: number;
    uploadPath: string;
  } {
    switch (type) {
      case 'profile':
        return {
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          maxSize: 5 * 1024 * 1024, // 5MB
          uploadPath: 'profiles',
        };
      case 'diary':
        return {
          allowedTypes: [
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
          ],
          maxSize: 10 * 1024 * 1024, // 10MB
          uploadPath: 'diary',
        };
      default:
        throw new BadRequestException('지원되지 않는 업로드 타입입니다.');
    }
  }
}
