# NASA Proxy Server for KisanAI

실시간 NASA 위성 데이터를 제공하는 프록시 서버입니다.

## 배포 방법

### Railway 배포 (추천)
1. [Railway](https://railway.app) 가입
2. "New Project" → "Deploy from GitHub repo"
3. 이 repository 선택
4. Root Directory: `/server` 설정
5. 환경 변수 설정: `GEMINI_API_KEY` (이미지 인식에 필요), 선택적으로 `GEMINI_VISION_MODEL` (기본값 `gemini-3.8-flash`), NASA 인증이 필요하면 `NASA_TOKEN`
6. Node.js 20 이상 필요

### Render 배포
1. [Render](https://render.com) 가입
2. "New Web Service" 선택
3. GitHub repository 연결
4. Root Directory: `server` 설정
5. Build Command: `npm install`
6. Start Command: `npm start`

## API 엔드포인트

- `GET /api/health` - 서버 상태 확인
- `GET /api/smap/soil-moisture?lat={lat}&lon={lon}` - SMAP 토양 습도
- `GET /api/modis/ndvi?lat={lat}&lon={lon}` - MODIS NDVI 데이터
- `GET /api/landsat/imagery?lat={lat}&lon={lon}` - Landsat 이미지 데이터
- `POST /api/vision/identify` - 이미지 속 대상 인식 (Gemini). Body: `{ "image": "<base64>", "mimeType": "image/jpeg" }`. 이미지는 저장하지 않음

## 로컬 실행

```bash
cd server
npm install
npm start
```

서버가 포트 3001에서 실행됩니다.