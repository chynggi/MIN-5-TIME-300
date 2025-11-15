export class FileUploadProgressDto {
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  message?: string;
}

export class FileUploadResponseDto {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  message: string;
  uploadId?: string; // 업로드 추적용 ID
}
