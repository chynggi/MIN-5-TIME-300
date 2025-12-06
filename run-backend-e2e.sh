#!/bin/bash
# MIN-5-TIME-300 백엔드 E2E 테스트 실행 스크립트 (Linux/macOS)
# 사용법: ./run-backend-e2e.sh [options]
#
# Options:
#   --full            전체 통합 테스트만 실행 (기본값)
#   --all             모든 E2E 테스트 실행
#   --verbose         상세 로그 출력
#   --pattern <name>  특정 테스트 패턴만 실행
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
TEST_MODE="full"
VERBOSE=false
PATTERN=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 인자 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            TEST_MODE="full"
            shift
            ;;
        --all)
            TEST_MODE="all"
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --pattern|-p)
            PATTERN="$2"
            shift 2
            ;;
        --help|-h)
            echo "사용법: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --full            전체 통합 테스트만 실행 (기본값)"
            echo "  --all             모든 E2E 테스트 실행"
            echo "  --verbose, -v     상세 로그 출력"
            echo "  --pattern, -p     특정 테스트 패턴만 실행 (예: profile, diary, chat)"
            echo "  --help, -h        도움말 표시"
            echo ""
            echo "예시:"
            echo "  $0 --full                 # 전체 통합 테스트"
            echo "  $0 --all --verbose        # 모든 테스트 상세 로그"
            echo "  $0 --pattern profile      # 프로필 관련 테스트만"
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
echo "║         MIN-5-TIME-300 백엔드 E2E 테스트                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 시작 시간 기록
START_TIME=$(date +%s)

cd "$SCRIPT_DIR/backend"

# 의존성 확인
echo -e "${CYAN}[1/2] 의존성 설치 확인...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "  npm install 실행 중..."
    npm install
else
    echo -e "${GREEN}  의존성 이미 설치됨${NC}"
fi

# 테스트 실행
echo -e "\n${CYAN}[2/2] E2E 테스트 실행 중...${NC}"
echo -e "  모드: ${YELLOW}$TEST_MODE${NC}"

set +e  # 테스트 실패해도 스크립트 계속 실행

if [ -n "$PATTERN" ]; then
    echo -e "  패턴: ${YELLOW}$PATTERN${NC}"
    if [ "$VERBOSE" = true ]; then
        npm run test:e2e -- --testPathPattern="$PATTERN" --verbose
    else
        npm run test:e2e -- --testPathPattern="$PATTERN"
    fi
elif [ "$TEST_MODE" = "full" ]; then
    if [ "$VERBOSE" = true ]; then
        npm run test:e2e:verbose -- --testPathPattern=full-integration
    else
        npm run test:e2e:full
    fi
else
    if [ "$VERBOSE" = true ]; then
        npm run test:e2e:verbose
    else
        npm run test:e2e
    fi
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
    echo -e "${GREEN}  ✅ 백엔드 E2E 테스트 성공!${NC}"
else
    echo -e "${RED}  ❌ 백엔드 E2E 테스트 실패 (exit code: $TEST_RESULT)${NC}"
fi
echo -e "${CYAN}============================================================${NC}"

exit $TEST_RESULT
