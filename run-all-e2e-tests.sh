#!/bin/bash
# MIN-5-TIME-300 전체 E2E 테스트 실행 스크립트 (Linux/macOS)
# 사용법: ./run-all-e2e-tests.sh [options]
#
# Options:
#   --backend-only    백엔드 테스트만 실행
#   --frontend-only   프론트엔드 테스트만 실행
#   --verbose         상세 로그 출력
#   --help            도움말 표시

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 기본 설정
BACKEND_ONLY=false
FRONTEND_ONLY=false
VERBOSE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

# 인자 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "사용법: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --backend-only    백엔드 테스트만 실행"
            echo "  --frontend-only   프론트엔드 테스트만 실행"
            echo "  --verbose, -v     상세 로그 출력"
            echo "  --help, -h        도움말 표시"
            exit 0
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            echo "도움말: $0 --help"
            exit 1
            ;;
    esac
done

# 배너 출력
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         MIN-5-TIME-300 E2E 테스트 실행 스크립트              ║"
echo "║                                                              ║"
echo "║  - 백엔드: NestJS API 테스트 (Jest + Supertest)              ║"
echo "║  - 프론트엔드: UI 테스트 (Playwright)                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 시작 시간 기록
START_TIME=$(date +%s)
BACKEND_RESULT=0
FRONTEND_RESULT=0

# 백엔드 테스트
if [ "$FRONTEND_ONLY" = false ]; then
    echo -e "\n${YELLOW}============================================================${NC}"
    echo -e "${YELLOW}  백엔드 E2E 테스트 시작${NC}"
    echo -e "${YELLOW}============================================================${NC}"
    
    cd "$ROOT_DIR/backend"
    
    echo -e "\n${CYAN}[1/2] 의존성 설치 확인...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "  npm install 실행 중..."
        npm install
    else
        echo -e "${GREEN}  의존성 이미 설치됨${NC}"
    fi
    
    echo -e "\n${CYAN}[2/2] E2E 테스트 실행 중...${NC}"
    set +e  # 테스트 실패해도 스크립트 계속 실행
    if [ "$VERBOSE" = true ]; then
        npm run test:e2e:verbose
    else
        npm run test:e2e:full
    fi
    BACKEND_RESULT=$?
    set -e
    
    if [ $BACKEND_RESULT -eq 0 ]; then
        echo -e "\n${GREEN}✅ 백엔드 테스트 완료: 성공${NC}"
    else
        echo -e "\n${RED}❌ 백엔드 테스트 완료: 실패 (exit code: $BACKEND_RESULT)${NC}"
    fi
fi

# 프론트엔드 테스트
if [ "$BACKEND_ONLY" = false ]; then
    echo -e "\n${YELLOW}============================================================${NC}"
    echo -e "${YELLOW}  프론트엔드 E2E 테스트 시작${NC}"
    echo -e "${YELLOW}============================================================${NC}"
    
    cd "$ROOT_DIR/frontend"
    
    echo -e "\n${CYAN}[1/3] 의존성 설치 확인...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "  npm install 실행 중..."
        npm install
    else
        echo -e "${GREEN}  의존성 이미 설치됨${NC}"
    fi
    
    echo -e "\n${CYAN}[2/3] Playwright 브라우저 설치 확인...${NC}"
    npx playwright install chromium --with-deps 2>/dev/null || true
    
    echo -e "\n${CYAN}[3/3] E2E 테스트 실행 중...${NC}"
    set +e  # 테스트 실패해도 스크립트 계속 실행
    if [ "$VERBOSE" = true ]; then
        npx playwright test --reporter=list
    else
        npm run test:e2e
    fi
    FRONTEND_RESULT=$?
    set -e
    
    if [ $FRONTEND_RESULT -eq 0 ]; then
        echo -e "\n${GREEN}✅ 프론트엔드 테스트 완료: 성공${NC}"
    else
        echo -e "\n${RED}❌ 프론트엔드 테스트 완료: 실패 (exit code: $FRONTEND_RESULT)${NC}"
    fi
fi

# 종료 시간 계산
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# 결과 요약
echo -e "\n${CYAN}============================================================${NC}"
echo -e "${CYAN}  테스트 결과 요약${NC}"
echo -e "${CYAN}============================================================${NC}"

printf "\n${WHITE}  실행 시간: %02d:%02d${NC}\n" $MINUTES $SECONDS

if [ "$FRONTEND_ONLY" = false ]; then
    if [ $BACKEND_RESULT -eq 0 ]; then
        echo -e "  백엔드 테스트:    ${GREEN}✅ 성공${NC}"
    else
        echo -e "  백엔드 테스트:    ${RED}❌ 실패${NC}"
    fi
fi

if [ "$BACKEND_ONLY" = false ]; then
    if [ $FRONTEND_RESULT -eq 0 ]; then
        echo -e "  프론트엔드 테스트: ${GREEN}✅ 성공${NC}"
    else
        echo -e "  프론트엔드 테스트: ${RED}❌ 실패${NC}"
    fi
fi

# 최종 결과
TOTAL_RESULT=$((BACKEND_RESULT + FRONTEND_RESULT))
if [ $TOTAL_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}🎉 모든 테스트 통과!${NC}"
else
    echo -e "\n${YELLOW}⚠️ 일부 테스트 실패. 위의 로그를 확인하세요.${NC}"
fi

echo -e "\n${CYAN}============================================================${NC}"

# 원래 디렉토리로 복귀
cd "$ROOT_DIR"

exit $TOTAL_RESULT
