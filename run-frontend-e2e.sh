#!/bin/bash
# MIN-5-TIME-300 프론트엔드 E2E 테스트 실행 스크립트 (Linux/macOS)
# 사용법: ./run-frontend-e2e.sh [options]
#
# Options:
#   --ui              UI 모드로 실행 (디버깅용)
#   --headed          브라우저 표시하며 실행
#   --debug           디버그 모드
#   --browser <name>  특정 브라우저만 테스트 (chromium, firefox, webkit)
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
UI_MODE=false
HEADED=false
DEBUG=false
BROWSER=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 인자 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --ui)
            UI_MODE=true
            shift
            ;;
        --headed)
            HEADED=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --browser|-b)
            BROWSER="$2"
            shift 2
            ;;
        --help|-h)
            echo "사용법: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --ui              UI 모드로 실행 (디버깅용)"
            echo "  --headed          브라우저 표시하며 실행"
            echo "  --debug           디버그 모드"
            echo "  --browser, -b     특정 브라우저만 테스트"
            echo "                    (chromium, firefox, webkit, 'Mobile Chrome', 'Mobile Safari')"
            echo "  --help, -h        도움말 표시"
            echo ""
            echo "예시:"
            echo "  $0                        # 기본 테스트 실행"
            echo "  $0 --ui                   # UI 모드"
            echo "  $0 --browser chromium     # Chrome만 테스트"
            echo "  $0 --headed --debug       # 브라우저 표시 + 디버그"
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
echo "║         MIN-5-TIME-300 프론트엔드 E2E 테스트                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 시작 시간 기록
START_TIME=$(date +%s)

cd "$SCRIPT_DIR/frontend"

# 의존성 확인
echo -e "${CYAN}[1/3] 의존성 설치 확인...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "  npm install 실행 중..."
    npm install
else
    echo -e "${GREEN}  의존성 이미 설치됨${NC}"
fi

# Playwright 브라우저 설치
echo -e "\n${CYAN}[2/3] Playwright 브라우저 설치 확인...${NC}"
if [ -n "$BROWSER" ]; then
    npx playwright install "$BROWSER" --with-deps 2>/dev/null || true
else
    npx playwright install --with-deps 2>/dev/null || true
fi

# 테스트 실행
echo -e "\n${CYAN}[3/3] E2E 테스트 실행 중...${NC}"

# 옵션 빌드
PLAYWRIGHT_ARGS=""

if [ "$UI_MODE" = true ]; then
    PLAYWRIGHT_ARGS="--ui"
    echo -e "  모드: ${YELLOW}UI${NC}"
elif [ "$DEBUG" = true ]; then
    PLAYWRIGHT_ARGS="--debug"
    echo -e "  모드: ${YELLOW}Debug${NC}"
elif [ "$HEADED" = true ]; then
    PLAYWRIGHT_ARGS="--headed"
    echo -e "  모드: ${YELLOW}Headed${NC}"
else
    echo -e "  모드: ${YELLOW}Headless${NC}"
fi

if [ -n "$BROWSER" ]; then
    PLAYWRIGHT_ARGS="$PLAYWRIGHT_ARGS --project=$BROWSER"
    echo -e "  브라우저: ${YELLOW}$BROWSER${NC}"
fi

set +e  # 테스트 실패해도 스크립트 계속 실행

if [ -n "$PLAYWRIGHT_ARGS" ]; then
    npx playwright test $PLAYWRIGHT_ARGS
else
    npm run test:e2e
fi

TEST_RESULT=$?
set -e

# 종료 시간 계산
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# 결과 출력
echo -e "\n${CYAN}============================================================${NC}"
printf "${WHITE}  실행 시간: %02d:%02d${NC}\n" $MINUTES $SECONDS

if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}  ✅ 프론트엔드 E2E 테스트 성공!${NC}"
else
    echo -e "${RED}  ❌ 프론트엔드 E2E 테스트 실패 (exit code: $TEST_RESULT)${NC}"
    echo -e "${YELLOW}  💡 리포트 확인: npx playwright show-report${NC}"
fi
echo -e "${CYAN}============================================================${NC}"

exit $TEST_RESULT
