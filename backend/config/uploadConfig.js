import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 경로 설정
export const uploadConfig = {
  baseDir: path.join(__dirname, '..', 'uploads'),
  profileDir: path.join(__dirname, '..', 'uploads', 'profiles'),
  tempDir: path.join(__dirname, '..', 'uploads', 'temp'),
  maxSize: 5 * 1024 * 1024 // 5MB
};

// 디렉토리 생성 및 권한 설정
export const initializeUploadDirectories = () => {
  const directories = [
    uploadConfig.baseDir,
    uploadConfig.profileDir,
    uploadConfig.tempDir
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        // 디렉토리 생성 (recursive: true로 중첩 경로도 생성)
        fs.mkdirSync(dir, { recursive: true });
        
        // 권한 설정 (755: 소유자 전체 권한, 그룹/기타 사용자 읽기/실행 권한)
        fs.chmodSync(dir, 0o755);
        
        console.log(`디렉토리 생성 완료: ${dir}`);
      } catch (error) {
        console.error(`디렉토리 생성 실패: ${dir}`, error);
        throw error;
      }
    }
  });
}; 