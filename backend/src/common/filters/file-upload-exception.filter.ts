import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class FileUploadExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '파일 업로드 중 오류가 발생했습니다.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception.message) {
      // 파일 관련 에러 메시지 커스터마이징
      if (exception.message.includes('File too large')) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = '파일 크기가 너무 큽니다. 최대 업로드 크기를 확인해주세요.';
      } else if (exception.message.includes('Unexpected field')) {
        status = HttpStatus.BAD_REQUEST;
        message = '올바르지 않은 파일 필드입니다.';
      } else if (exception.message.includes('지원되지 않는 파일 형식')) {
        status = HttpStatus.BAD_REQUEST;
        message =
          '지원되지 않는 파일 형식입니다. 이미지 파일만 업로드 가능합니다.';
      } else {
        message = exception.message;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
