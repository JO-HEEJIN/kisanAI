# Vercel 배포 가이드

## 🚀 자동 배포 (GitHub 연동)

### 1. Vercel 웹사이트에서 배포 (권장)

1. **Vercel 가입/로그인**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - "New Project" 클릭
   - GitHub 리포지토리 선택: `JO-HEEJIN/kisanAI`
   - Import 클릭

3. **프로젝트 설정**
   - Framework Preset: `Other` 선택
   - Build Command: 비워두기 (정적 파일이므로)
   - Output Directory: `.` (루트 디렉토리)
   - Install Command: `npm install`

4. **환경 변수 (필요시)**
   - 특별한 환경 변수는 없음

5. **Deploy 클릭**
   - 자동으로 빌드 및 배포 진행
   - 배포 URL 생성됨 (예: `https://kisanai.vercel.app`)

## 📁 프로젝트 구조

```
kisanAI/
├── api/                    # Vercel Serverless Functions
│   ├── index.js           # 메인 서버리스 함수
│   └── nasa-proxy.js      # NASA API 프록시 함수
├── src/                   # 프론트엔드 소스 코드
│   └── config/api.js      # API 엔드포인트 설정
├── index.html             # 메인 HTML 파일
├── vercel.json           # Vercel 설정 파일
└── package.json          # 프로젝트 의존성
```

## 🔧 로컬 테스트 (선택사항)

```bash
# Vercel CLI 설치 (이미 설치된 경우 스킵)
npm i -g vercel

# 로컬에서 Vercel 환경 테스트
vercel dev

# 프로덕션 배포
vercel --prod
```

## ✅ 배포 확인사항

1. **API 엔드포인트 작동 확인**
   - `https://your-app.vercel.app/api/smap/soil-moisture?lat=33.4255&lon=-111.9400`
   - 시뮬레이션 데이터가 반환되어야 함

2. **메인 페이지 로드 확인**
   - `https://your-app.vercel.app`
   - NASA Farm Navigators 페이지가 정상 로드

3. **기능 테스트**
   - Satellite Data Visualization 탭
   - NASA Tutorial 모듈
   - Farm Game 시뮬레이션

## 🌟 자동 배포 설정

GitHub 리포지토리와 연동되면:
- `main` 브랜치에 push 시 자동 배포
- Pull Request 시 Preview 배포 생성

## 🔍 트러블슈팅

### API 호출이 안 될 때
- 브라우저 개발자 도구에서 Network 탭 확인
- `/api` 경로로 호출되는지 확인
- CORS 에러 확인

### 페이지가 안 열릴 때
- Vercel 대시보드에서 Build Logs 확인
- Function Logs 확인

## 📝 참고사항

- 현재 NASA API는 시뮬레이션 데이터 반환 (실제 API 키 필요시 환경변수 추가)
- 정적 파일은 자동으로 CDN에 캐싱됨
- 서버리스 함수는 요청 시마다 실행됨