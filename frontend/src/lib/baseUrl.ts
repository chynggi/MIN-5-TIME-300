// 공통 API Base URL 정상화 유틸
// 목적: 환경변수에 /api, /api/api, /api/api/api 가 중첩되어도 결국 호출은
//   <origin>/api/v1/... 형태 (삼중, 이중 중복 제거)
// 권장: NEXT_PUBLIC_API_URL 은 origin 만 지정 (예: https://chynggi.cafe24.com)
// 기존에 /api, /api/api 등을 붙여둔 경우 자동으로 제거한다.

const RAW_ENV = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// 끝에 연속으로 붙은 /api 세그먼트 모두 제거
// 예: https://host/api -> https://host
//     https://host/api/api -> https://host
//     https://host/api/api/api -> https://host
const NORMALIZED_ORIGIN = RAW_ENV.replace(/(\/api)+(\/?$)/, '');

// 버전 prefix 통일: 백엔드 컨트롤러들이 @Controller('api/v1/...') 구조
export const API_BASE_V1 = `${NORMALIZED_ORIGIN}/api/api/v1`;
export const API_ORIGIN = NORMALIZED_ORIGIN;

// 헬퍼: 중복 /api/v1 방지하며 경로 결합
export function withApiV1(path: string) {
  if (!path) return API_BASE_V1;
  if (path.startsWith('/')) path = path.slice(1);
  return `${API_BASE_V1}/${path}`;
}

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.debug('[API BASE NORMALIZED]', { RAW_ENV, NORMALIZED_ORIGIN, API_BASE_V1 });
}
