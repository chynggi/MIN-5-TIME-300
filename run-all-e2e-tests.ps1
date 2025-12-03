# MIN-5-TIME-300 전체 E2E 테스트 실행 스크립트
# 사용법: .\run-all-e2e-tests.ps1

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = $ScriptDir

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║         MIN-5-TIME-300 E2E 테스트 실행 스크립트              ║
║                                                              ║
║  - 백엔드: NestJS API 테스트 (Jest + Supertest)              ║
║  - 프론트엔드: UI 테스트 (Playwright)                        ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

$startTime = Get-Date
$backendResult = 0
$frontendResult = 0

# 백엔드 테스트
if (-not $FrontendOnly) {
    Write-Host "`n" + "="*60 -ForegroundColor Yellow
    Write-Host "  백엔드 E2E 테스트 시작" -ForegroundColor Yellow
    Write-Host "="*60 -ForegroundColor Yellow
    
    Set-Location -Path "$RootDir\backend"
    
    Write-Host "`n[1/2] 의존성 설치 확인..." -ForegroundColor Cyan
    if (-not (Test-Path "node_modules")) {
        Write-Host "  npm install 실행 중..." -ForegroundColor Gray
        npm install
    } else {
        Write-Host "  의존성 이미 설치됨" -ForegroundColor Green
    }
    
    Write-Host "`n[2/2] E2E 테스트 실행 중..." -ForegroundColor Cyan
    if ($Verbose) {
        npm run test:e2e:verbose
    } else {
        npm run test:e2e:full
    }
    $backendResult = $LASTEXITCODE
    
    if ($backendResult -eq 0) {
        Write-Host "`n✅ 백엔드 테스트 완료: 성공" -ForegroundColor Green
    } else {
        Write-Host "`n❌ 백엔드 테스트 완료: 실패 (exit code: $backendResult)" -ForegroundColor Red
    }
}

# 프론트엔드 테스트
if (-not $BackendOnly) {
    Write-Host "`n" + "="*60 -ForegroundColor Yellow
    Write-Host "  프론트엔드 E2E 테스트 시작" -ForegroundColor Yellow
    Write-Host "="*60 -ForegroundColor Yellow
    
    Set-Location -Path "$RootDir\frontend"
    
    Write-Host "`n[1/3] 의존성 설치 확인..." -ForegroundColor Cyan
    if (-not (Test-Path "node_modules")) {
        Write-Host "  npm install 실행 중..." -ForegroundColor Gray
        npm install
    } else {
        Write-Host "  의존성 이미 설치됨" -ForegroundColor Green
    }
    
    Write-Host "`n[2/3] Playwright 브라우저 설치 확인..." -ForegroundColor Cyan
    npx playwright install chromium --with-deps 2>$null
    
    Write-Host "`n[3/3] E2E 테스트 실행 중..." -ForegroundColor Cyan
    if ($Verbose) {
        npx playwright test --reporter=list
    } else {
        npm run test:e2e
    }
    $frontendResult = $LASTEXITCODE
    
    if ($frontendResult -eq 0) {
        Write-Host "`n✅ 프론트엔드 테스트 완료: 성공" -ForegroundColor Green
    } else {
        Write-Host "`n❌ 프론트엔드 테스트 완료: 실패 (exit code: $frontendResult)" -ForegroundColor Red
    }
}

# 결과 요약
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "  테스트 결과 요약" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

Write-Host "`n  실행 시간: $($duration.ToString('mm\:ss'))" -ForegroundColor White

if (-not $FrontendOnly) {
    if ($backendResult -eq 0) {
        Write-Host "  백엔드 테스트:    ✅ 성공" -ForegroundColor Green
    } else {
        Write-Host "  백엔드 테스트:    ❌ 실패" -ForegroundColor Red
    }
}

if (-not $BackendOnly) {
    if ($frontendResult -eq 0) {
        Write-Host "  프론트엔드 테스트: ✅ 성공" -ForegroundColor Green
    } else {
        Write-Host "  프론트엔드 테스트: ❌ 실패" -ForegroundColor Red
    }
}

# 최종 결과
$totalResult = $backendResult + $frontendResult
if ($totalResult -eq 0) {
    Write-Host "`n🎉 모든 테스트 통과!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ 일부 테스트 실패. 위의 로그를 확인하세요." -ForegroundColor Yellow
}

Write-Host "`n" + "="*60 -ForegroundColor Cyan

# 원래 디렉토리로 복귀
Set-Location -Path $RootDir

exit $totalResult
