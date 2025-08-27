/**
 * API 연결 테스트 유틸리티
 * 수정된 API URL 구성이 올바르게 작동하는지 확인하는 함수들
 */

// API URL 구성 테스트
export const testApiUrlConstruction = () => {
  const testCases = [
    {
      name: 'Local development',
      env: 'http://localhost:3001',
      expected: {
        base: 'http://localhost:3001',
        api: 'http://localhost:3001/api/v1',
        chat: 'http://localhost:3001/chat'
      }
    },
    {
      name: 'Cafe24 production',
      env: 'https://chynggi.cafe24.com',
      expected: {
        base: 'https://chynggi.cafe24.com',
        api: 'https://chynggi.cafe24.com/api/api/v1',
        chat: 'https://chynggi.cafe24.com/api/api/chat'
      }
    },
    {
      name: 'Cafe24 with /api already included',
      env: 'https://chynggi.cafe24.com/api',
      expected: {
        base: 'https://chynggi.cafe24.com/api',
        api: 'https://chynggi.cafe24.com/api/api/v1',
        chat: 'https://chynggi.cafe24.com/api/api/chat'
      }
    },
    {
      name: 'Cafe24 with /api/api already included',
      env: 'https://chynggi.cafe24.com/api/api',
      expected: {
        base: 'https://chynggi.cafe24.com/api/api',
        api: 'https://chynggi.cafe24.com/api/api/v1',
        chat: 'https://chynggi.cafe24.com/api/api/chat'
      }
    }
  ];

  console.log('🧪 API URL 구성 테스트');
  console.log('='.repeat(50));

  testCases.forEach(testCase => {
    console.log(`\n📝 테스트: ${testCase.name}`);
    console.log(`입력: ${testCase.env}`);
    
    // 각 구성 방식 테스트
    const results = {
      base: testCase.env,
      api: constructApiUrl(testCase.env),
      chat: constructChatUrl(testCase.env)
    };
    
    console.log('결과:');
    Object.entries(results).forEach(([key, value]) => {
      const expected = testCase.expected[key as keyof typeof testCase.expected];
      const status = value === expected ? '✅' : '❌';
      console.log(`  ${key}: ${value} ${status}`);
      if (value !== expected) {
        console.log(`    예상: ${expected}`);
      }
    });
  });
};

// API URL 구성 함수 (lib/api.ts와 동일한 로직)
const constructApiUrl = (baseUrl: string): string => {
  let url = baseUrl;
  
  if (url.includes('cafe24.com')) {
    // cafe24 환경에서는 /api/api/v1 형태로 구성 (의도된 구조)
    if (!url.includes('/api/api/v1')) {
      if (url.endsWith('/api/api')) {
        url = url + '/v1';
      } else if (url.endsWith('/api')) {
        url = url + '/api/v1';
      } else {
        url = url.replace(/\/$/, '') + '/api/api/v1';
      }
    }
  } else {
    // 로컬 환경에서는 기존 방식 유지
    if (!url.includes('/api/v1')) {
      url = url + '/api/v1';
    }
  }
  return url;
};

// Chat URL 구성 함수 (useWebSocket.ts와 동일한 로직)
const constructChatUrl = (baseUrl: string): string => {
  let url = baseUrl;
  
  if (url.includes('cafe24.com')) {
    // cafe24 환경에서는 /api/api 형태로 구성 (의도된 구조)
    if (!url.includes('/api/api')) {
      if (url.endsWith('/api')) {
        url = url + '/api';
      } else {
        url = url.replace(/\/$/, '') + '/api/api';
      }
    }
  }
  return url + '/chat';
};

// 실제 API 연결 테스트
export const testApiConnection = async () => {
  console.log('\n🌐 실제 API 연결 테스트');
  console.log('='.repeat(50));
  
  const apiUrl = constructApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
  
  try {
    console.log(`연결 시도: ${apiUrl}/health`);
    
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ API 서버 연결 성공');
      const data = await response.text();
      console.log('응답:', data);
    } else {
      console.log(`❌ API 서버 연결 실패: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ API 서버 연결 오류:', error);
  }
};

// 브라우저 콘솔에서 실행할 수 있는 전체 테스트
export const runAllTests = () => {
  testApiUrlConstruction();
  testApiConnection();
};

// 개발 환경에서만 전역 객체에 테스트 함수 추가
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).apiTest = {
    testApiUrlConstruction,
    testApiConnection,
    runAllTests
  };
  
  console.log('🔧 API 테스트 함수가 window.apiTest에 추가되었습니다.');
  console.log('사용법: window.apiTest.runAllTests()');
}