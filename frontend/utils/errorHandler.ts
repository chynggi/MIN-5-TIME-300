import axios from 'axios';
import { CustomError } from '@/types/error';
import { toast } from '@/components/ui/use-toast';

// HTTP 상태 코드
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  SERVER_ERROR: 500,
} as const;

// 에러 메시지
const ERROR_MESSAGES = {
  AUTH: {
    title: "인증 오류",
    description: "로그인이 필요합니다.",
    message: "인증되지 않은 사용자입니다.",
  },
  PERMISSION: {
    title: "권한 오류", 
    description: "해당 작업을 수행할 권한이 없습니다.",
    message: "권한이 없습니다.",
  },
  VALIDATION: {
    title: "입력 오류",
    description: "잘못된 요청입니다.",
  },
  SERVER: {
    title: "서버 오류",
    description: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    message: "서버 오류가 발생했습니다.",
  },
  UNKNOWN: {
    title: "오류",
    description: "알 수 없는 오류가 발생했습니다.",
    message: "알 수 없는 오류가 발생했습니다.",
  }
} as const;

// API 응답 데이터 타입
interface APIErrorResponse {
  error: string;
  details?: unknown;
}

// 에러 로깅 함수
function logError(error: unknown, additionalInfo?: unknown) {
  console.error('[API Error]:', {
    error,
    additionalInfo,
    timestamp: new Date().toISOString(),
  });
}

export function handleAPIError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as APIErrorResponse;

    logError(error, { status, data });

    // 인증 관련 에러
    if (status === HTTP_STATUS.UNAUTHORIZED) {
      toast({
        title: ERROR_MESSAGES.AUTH.title,
        description: ERROR_MESSAGES.AUTH.description,
        variant: "destructive"
      });
      throw new CustomError(ERROR_MESSAGES.AUTH.message, status);
    }

    // 권한 관련 에러
    if (status === HTTP_STATUS.FORBIDDEN) {
      toast({
        title: ERROR_MESSAGES.PERMISSION.title,
        description: ERROR_MESSAGES.PERMISSION.description,
        variant: "destructive"
      });
      throw new CustomError(ERROR_MESSAGES.PERMISSION.message, status);
    }

    // 유효성 검사 에러
    if (status === HTTP_STATUS.BAD_REQUEST) {
      toast({
        title: ERROR_MESSAGES.VALIDATION.title,
        description: data.error || ERROR_MESSAGES.VALIDATION.description,
        variant: "destructive"
      });
      throw new CustomError(data.error, status, data.details as Record<string, string[]> | undefined);
    }

    // 서버 에러
    if (status && status >= HTTP_STATUS.SERVER_ERROR) {
      toast({
        title: ERROR_MESSAGES.SERVER.title,
        description: ERROR_MESSAGES.SERVER.description,
        variant: "destructive"
      });
      throw new CustomError(ERROR_MESSAGES.SERVER.message, status);
    }

    // 기타 에러
    toast({
      title: ERROR_MESSAGES.UNKNOWN.title,
      description: data?.error || ERROR_MESSAGES.UNKNOWN.description,
      variant: "destructive"
    });
    throw new CustomError(
      data?.error || ERROR_MESSAGES.UNKNOWN.message, 
      status || HTTP_STATUS.SERVER_ERROR
    );
  }

  // axios 에러가 아닌 경우
  logError(error);
  toast({
    title: ERROR_MESSAGES.UNKNOWN.title,
    description: ERROR_MESSAGES.UNKNOWN.description,
    variant: "destructive"
  });
  throw new CustomError(ERROR_MESSAGES.UNKNOWN.message);
}