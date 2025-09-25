# 🛰️ Real Data Integration Plan for Farm Globe 3D

## 현재 상황 분석
현재 FarmGlobe3D에서 표시되는 4개 농장은 모두 **하드코딩된 가짜 데이터**입니다:

```javascript
// 현재 FarmGlobe3D.js 내부의 가짜 데이터
this.farmData = [
    {
        id: 1,
        name: "Johnson Family Farm",
        location: "Story County, IA",
        coordinates: [-93.6250, 41.5868], // 하드코딩된 좌표
        acres: 320,                       // 가짜 크기
        price: 1200000,                   // 가짜 가격
        // ... 기타 모든 데이터가 가짜
    }
]
```

## 🎯 실제 데이터 통합 단계별 계획

### 1단계: 실제 농장 매물 데이터 소스 확보
```javascript
// 가능한 실제 데이터 소스들:

// A. 부동산 API 연동
const REAL_ESTATE_APIS = {
    landAndFarm: 'https://api.landandfarm.com/properties',
    farmFlip: 'https://api.farmflip.com/listings',
    landSearch: 'https://api.landsearch.com/agricultural'
};

// B. 정부 데이터 활용
const GOVERNMENT_DATA = {
    usda: 'https://quickstats.nass.usda.gov/api',
    census: 'https://api.census.gov/data/2017/agcensus'
};

// C. 농업 통계 데이터
const AGRICULTURAL_DATA = {
    nass: 'https://quickstats.nass.usda.gov/api/get_counts',
    fsa: 'https://www.fsa.usda.gov/news-room/efoia/electronic-reading-room/'
};
```

### 2단계: 동적 데이터 로딩 시스템 구현
```javascript
// 새로운 FarmDataService 클래스 생성
class FarmDataService {
    constructor() {
        this.apiKeys = {
            landAndFarm: process.env.LAND_AND_FARM_API_KEY,
            usda: process.env.USDA_API_KEY,
            census: process.env.CENSUS_API_KEY
        };
    }

    async fetchRealFarmListings(bbox, filters = {}) {
        // 실제 농장 매물 데이터 가져오기
        try {
            const response = await fetch(`/api/farm-listings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boundingBox: bbox,
                    filters: {
                        minAcres: filters.minAcres || 50,
                        maxPrice: filters.maxPrice || 5000000,
                        cropTypes: filters.cropTypes || ['corn', 'soybean'],
                        hasWaterRights: filters.hasWaterRights
                    }
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch real farm data:', error);
            return this.getFallbackData(bbox);
        }
    }
}
```

### 3단계: 실시간 NASA 데이터 통합 강화
```javascript
// 현재 있는 NASA 프록시 서버 확장
// server/nasa-proxy.js에 새로운 엔드포인트 추가

app.get('/api/farm-analysis/:lat/:lon', async (req, res) => {
    const { lat, lon } = req.params;

    try {
        // 병렬로 모든 NASA 데이터 가져오기
        const [smapData, modisData, gpmData, landsat] = await Promise.all([
            fetchSMAPData(lat, lon),      // 토양 수분
            fetchMODISData(lat, lon),     // NDVI, 식생지수
            fetchGPMData(lat, lon),       // 강우량
            fetchLandsatData(lat, lon)    // 지표면 온도, 토지 이용
        ]);

        // 농업 적합성 점수 계산
        const agriculturalScore = calculateAgriculturalViability({
            soilMoisture: smapData.soilMoisture,
            ndvi: modisData.ndvi,
            precipitation: gpmData.precipitation,
            temperature: landsat.surfaceTemperature
        });

        res.json({
            location: { lat, lon },
            nasa: { smapData, modisData, gpmData, landsat },
            analysis: {
                agriculturalScore,
                droughtRisk: calculateDroughtRisk(smapData, gpmData),
                cropRecommendations: getCropRecommendations(lat, lon, agriculturalScore)
            },
            timestamp: new Date().toISOString(),
            source: 'NASA Real-time Data'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch NASA data' });
    }
});
```

### 4단계: FarmGlobe3D 수정 - 동적 데이터 로딩
```javascript
// FarmGlobe3D.js 수정안
class FarmGlobe3D {
    constructor(containerId) {
        this.containerId = containerId;
        this.farmDataService = new FarmDataService();
        this.farmData = []; // 빈 배열로 시작
        this.isLoadingData = false;
    }

    async initialize() {
        // 기존 초기화...

        // 실제 농장 데이터 로드
        await this.loadRealFarmData();

        // 기존 마커 추가...
    }

    async loadRealFarmData() {
        this.isLoadingData = true;
        this.showLoadingIndicator();

        try {
            // Iowa 지역 경계 상자 (현재 뷰 기준)
            const iowaBbox = {
                north: 43.5,
                south: 40.4,
                east: -90.1,
                west: -96.6
            };

            // 실제 농장 매물 데이터 가져오기
            const realFarms = await this.farmDataService.fetchRealFarmListings(iowaBbox);

            // 각 농장에 대해 실시간 NASA 데이터 추가
            const farmsWithNASAData = await Promise.all(
                realFarms.map(async (farm) => {
                    const nasaAnalysis = await fetch(
                        `/api/farm-analysis/${farm.coordinates[1]}/${farm.coordinates[0]}`
                    ).then(r => r.json());

                    return {
                        ...farm,
                        soilMoisture: nasaAnalysis.nasa.smapData.soilMoisture,
                        ndvi: nasaAnalysis.nasa.modisData.ndvi,
                        precipitation: nasaAnalysis.nasa.gpmData.precipitation,
                        agriculturalScore: nasaAnalysis.analysis.agriculturalScore,
                        droughtRisk: nasaAnalysis.analysis.droughtRisk
                    };
                })
            );

            this.farmData = farmsWithNASAData;
            console.log(`✅ Loaded ${this.farmData.length} real farm listings with NASA data`);

        } catch (error) {
            console.warn('Failed to load real data, using fallback:', error);
            this.farmData = this.getFallbackFarmData();
        } finally {
            this.isLoadingData = false;
            this.hideLoadingIndicator();
            this.addFarmMarkers(); // 마커 다시 추가
        }
    }

    showLoadingIndicator() {
        const loading = document.createElement('div');
        loading.id = 'farm-data-loading';
        loading.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(7, 23, 63, 0.95);
            color: white;
            padding: 20px;
            border-radius: 12px;
            z-index: 10000;
            text-align: center;
            backdrop-filter: blur(8px);
        `;
        loading.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 12px;">🛰️</div>
            <div style="font-size: 16px; font-weight: bold;">Loading Real Farm Data</div>
            <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">
                Fetching live NASA satellite data...
            </div>
            <div style="margin-top: 16px;">
                <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.2);
                            border-radius: 2px; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #2E96F5, #0042A6);
                                animation: loading 2s infinite ease-in-out;"></div>
                </div>
            </div>
            <style>
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            </style>
        `;
        document.getElementById(this.containerId).appendChild(loading);
    }
}
```

### 5단계: 실제 구현을 위한 API 키 설정
```bash
# 환경 변수 설정 (.env 파일)
LAND_AND_FARM_API_KEY=your_land_and_farm_api_key
USDA_NASS_API_KEY=your_usda_api_key
CENSUS_API_KEY=your_census_api_key
REAL_ESTATE_API_KEY=your_real_estate_api_key

# 무료로 사용 가능한 데이터 소스들:
USDA_NASS_API=SIGN_UP_FREE        # https://quickstats.nass.usda.gov/api
US_CENSUS_API=SIGN_UP_FREE        # https://api.census.gov/
LAND_RECORDS=PUBLIC_DATA          # 각 주별 공공 기록
```

### 6단계: 데이터 캐싱 및 성능 최적화
```javascript
// 캐싱 시스템 추가
class FarmDataCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 30 * 60 * 1000; // 30분 캐시
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }
}
```

## 🚀 구현 우선순위

### Phase 1 (즉시 구현 가능)
1. **USDA NASS API 연동** - 무료, 공식 농업 통계
2. **기존 NASA 프록시 서버 확장** - 이미 구축된 인프라 활용
3. **동적 로딩 시스템** - 하드코딩 제거

### Phase 2 (중기 구현)
1. **상용 부동산 API 연동** - 실제 매물 데이터
2. **농장 평가 알고리즘** - NASA 데이터 기반 점수 계산
3. **실시간 업데이트** - WebSocket 또는 Server-Sent Events

### Phase 3 (장기 구현)
1. **머신러닝 예측** - 작물 수확량, 가격 예측
2. **사용자 맞춤 추천** - 투자 성향 기반 필터링
3. **소셜 기능** - 농장주 리뷰, 커뮤니티

## 💡 당장 테스트해볼 수 있는 방법

```javascript
// 브라우저 콘솔에서 실행 (현재 프로젝트에서)
// 실제 NASA 데이터로 농장 데이터 업데이트 테스트

async function updateFarmWithRealNASAData(farmId) {
    const farm = farmGlobe3D.farmData.find(f => f.id === farmId);
    const coords = farm.coordinates;

    try {
        const response = await fetch(`http://localhost:3001/api/comprehensive-data?lat=${coords[1]}&lon=${coords[0]}`);
        const nasaData = await response.json();

        // 기존 가짜 데이터를 실제 NASA 데이터로 교체
        farm.soilMoisture = nasaData.smap?.soilMoisture || farm.soilMoisture;
        farm.ndvi = nasaData.modis?.ndvi || farm.ndvi;
        farm.precipitation = nasaData.gpm?.precipitation || farm.precipitation;

        console.log('Updated farm with real NASA data:', farm);
        return farm;
    } catch (error) {
        console.error('Failed to update with real data:', error);
    }
}

// 사용법:
updateFarmWithRealNASAData(1); // Johnson Family Farm 업데이트
```

이 계획을 단계별로 구현하면 완전히 실제 데이터 기반의 농장 투자 분석 시스템을 구축할 수 있습니다!