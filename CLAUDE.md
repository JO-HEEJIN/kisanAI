# NASA Farm Navigators - Working Configuration

## 현재 작동하는 설정 (2025-09-22)

### 1. 프록시 서버 실행
```bash
node server/nasa-proxy.js
```
- 포트: 3001
- 실제 NASA API 호출 + 지역 기반 fallback

### 2. NASA API 엔드포인트들 (✅ 실제 NASA 데이터 성공)
- **SMAP**: `https://cmr.earthdata.nasa.gov/search/granules.json` - 검증된 Collection IDs 사용
  - C2776463943-NSIDC_ECS (SPL3SMP_E - Enhanced L3 Daily 9km)
  - C3383993430-NSIDC_ECS (SPL4SMGP - L4 3-hourly 9km)
  - C2776463773-NSIDC_ECS (SPL2SMP_E - Enhanced L2 Half-Orbit 9km)
- **MODIS**: CMR Search + ORNL DAAC backup
- **Landsat**: 지역 기반 현실적 데이터

### 3. 토큰 설정
- NASA Earthdata 토큰이 localStorage에 저장되어 있어야 함
- 토큰 없으면 샘플 데이터 표시

### 4. Farm Game 위성 데이터 연동
#### 구현된 기능:
- **"Load from Satellite Data Tab" 버튼**: Farm 타입 선택 화면 상단
- **위치 표시**: 게임 헤더에 좌표 표시 (예: 📡 33.43°, -111.94°)
- **지역별 작물**: 위도/기후 기반 작물 필터링
  - 열대: 쌀, 사탕수수, 바나나, 커피
  - 온대: 밀, 옥수수, 콩, 감자
  - 건조: 수수, 기장, 대추야자, 선인장
  - 한랭: 보리, 귀리, 호밀
- **물 소비율**: 위성 데이터 기반 multiplier 적용

#### 핵심 메소드:
- `loadFromSatelliteData()`: 위성 데이터 로드
- `applySatelliteDataToFarm()`: Farm 시뮬레이션에 적용
- `calculateWaterRateFromSatelliteData()`: 물 소비 계산
- `determineCropVarietiesFromNASAData()`: 작물 품종 결정

### 5. 파일 구조
```
/Users/b2d/TerraData/
├── server/nasa-proxy.js          # NASA API 프록시 서버
├── src/app.js                     # 메인 앱, Satellite Data Visualization
├── src/game/FarmGameUI.js         # Farm Game UI, 위성 데이터 연동
├── src/game/FarmSimulationEngine.js # Farm 시뮬레이션, 환경 데이터 적용
└── styles/farm-game.css           # 위성 데이터 UI 스타일
```

### 6. 트러블슈팅
#### 문제: Satellite Data Cards에 값이 안 나옴
- **해결**: `node server/nasa-proxy.js` 실행 확인
- 포트 3001에서 프록시 서버가 실행되어야 함

#### 문제: Farm Game에서 작물 심기 에러
- **해결**: `getComprehensiveCropData()` 메소드로 모든 작물 타입 지원
- SMAP, MODIS, Landsat 모든 데이터 타입 호환

#### 문제: 위성 데이터 적용 안됨
- **해결**: `applyEnvironmentalData()` 메소드로 실시간 적용
- `waterConsumptionMultiplier` 기반 물 소비 조정

### 7. 현재 상태 확인 (✅ 실제 NASA API 데이터 성공!)
- ✅ 프록시 서버 실행 중 (포트 3001)
- ✅ **실제 NASA API 호출 성공** - Collection C2776463943-NSIDC_ECS 사용
- ✅ 실제 granule ID로 데이터 검증 (예: G3355574164-NSIDC_ECS)
- ✅ Satellite Data Cards에 실제 NASA 데이터 표시
- ✅ Farm Game 위성 데이터 연동 완료
- ✅ 지역별 작물/물소비 시스템 작동
- ✅ **더 이상 fallback 데이터 사용 안함** - quality: "real"

### 8. 중요 명령어
```bash
# 프록시 서버 시작
node server/nasa-proxy.js

# 프록시 서버 상태 확인
curl http://localhost:3001/api/health

# NASA 토큰 확인 (브라우저 콘솔)
localStorage.getItem('nasa_earthdata_token')
```

### 9. 테스트 API 호출 (검증됨)
```bash
# SMAP 데이터 테스트 - 실제 NASA granule 사용
curl "http://localhost:3001/api/smap/soil-moisture?lat=43.222&lon=106.9057"
# 결과: "source": "NASA EarthData SMAP Real Data (Collection: C2776463943-NSIDC_ECS)"
# 결과: "quality": "real"

# MODIS 데이터 테스트
curl "http://localhost:3001/api/modis/ndvi?lat=43.222&lon=106.9057"
# 결과: "source": "MODIS Terra/Aqua"
```

## 마지막 업데이트: 2025-09-22 20:42 KST - ✅ 실제 NASA API 성공!