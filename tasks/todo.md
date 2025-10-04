# AR Health Score & SMAP Fix Plan

## Problem Statement
1. **Health Score**: 색상 기반 점수가 화면에 제대로 표시되지 않음
2. **SMAP 값**: 비가 안 왔는데 토양 수분이 30% 이상으로 부정확하게 표시됨

## Root Cause Analysis

### Health Score 문제:
- 새로운 `baseScore` 시스템을 구현했지만 UI에 반영 안됨
- `analyzeSurfaceType()` 함수의 `baseScore` 반환값이 제대로 전달되는지 확인 필요
- `showDetailedAnalysisPopup()` 함수가 새 점수를 표시하는지 확인 필요

### SMAP 값 문제:
- 실제 NASA API 데이터 vs fallback 데이터 구분 필요
- 위치 기반 데이터가 정확한지 확인
- SMAP API 응답을 로그로 확인하여 실제 값 검증

## Todo Tasks

### Phase 1: Health Score 디버깅
- [ ] **Task 1.1**: `analyzeSurfaceType()` 반환값 확인
  - `baseScore`가 제대로 계산되는지 콘솔 로그 확인
  - 빨간색/녹색 감지가 제대로 작동하는지 확인

- [ ] **Task 1.2**: `calculateHealthScore()` 점수 전달 확인
  - `baseScore` 사용 여부 확인
  - 최종 `finalScore` 계산 로직 검증

- [ ] **Task 1.3**: UI 표시 확인
  - `showDetailedAnalysisPopup()` 함수에서 Health Score 표시 부분 찾기
  - 새 점수가 UI에 반영되도록 수정

### Phase 2: SMAP 데이터 검증
- [ ] **Task 2.1**: SMAP API 응답 로깅
  - 실제 NASA API 호출 시 반환값 콘솔에 출력
  - fallback vs real data 구분 확인

- [ ] **Task 2.2**: 위치 기반 데이터 확인
  - GPS 좌표가 정확한지 확인
  - 해당 위치의 실제 토양 수분 값이 맞는지 검증

- [ ] **Task 2.3**: Fallback 데이터 조정 (필요시)
  - 현재 위치에 맞는 현실적인 fallback 값으로 수정

### Phase 3: 최종 테스트 및 검증
- [ ] **Task 3.1**: 빨간색 화면 테스트
  - 빨간색 화면 비추면 1-5점 나오는지 확인

- [ ] **Task 3.2**: 녹색 식물 테스트
  - 녹색 식물 비추면 88-100점 나오는지 확인

- [ ] **Task 3.3**: SMAP 값 현실성 확인
  - 현재 날씨/기후 조건과 일치하는지 확인

## Implementation Strategy
- **최소 변경**: 디버깅 로그 추가 → 문제 발견 → 최소한의 코드만 수정
- **단계별 검증**: 각 Phase 완료 후 사용자 확인 받고 다음 진행
- **중복 방지**: 기존 함수 절대 건드리지 않고 필요한 부분만 수정

## Files to Check
- `src/ar-functions.js`: analyzeSurfaceType, calculateHealthScore, showDetailedAnalysisPopup
- `server/nasa-proxy.js`: SMAP API 호출 로직 (필요시)

## Success Criteria
- ✅ 빨간색 → 1-5점
- ✅ 녹색 식물 → 88-100점
- ✅ SMAP 토양 수분이 현실적인 값 (현재 기후 조건 반영)

## Review Section
(작업 완료 후 작성)
