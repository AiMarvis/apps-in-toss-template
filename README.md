# 앱인토스 보일러플레이트 (appintoss-template)

> 토스 앱인토스 플랫폼용 앱 보일러플레이트. 검수 반려를 최소화하도록 설계되었습니다.

## 🚀 빠른 시작

### 1. 프로젝트 복사
```bash
cp -r appintoss-template my-new-app
cd my-new-app
```

### 2. 환경 설정
```bash
cp .env.example .env.local
# .env.local에 Firebase/Convex 환경변수 입력
```

### 3. 의존성 설치
```bash
npm install
```

### 4. Convex 설정
```bash
npx convex dev
```

### 5. 개발 서버 실행
```bash
npm run dev
```

## 📁 구조

```
├── convex/                  # Convex 백엔드
│   ├── auth.config.ts       # Firebase JWT 검증
│   ├── schema.ts            # DB 스키마
│   └── users.ts             # 사용자 CRUD
├── ref/                     # 참고 문서 (공식 문서 MD화)
├── src/
│   ├── main.tsx             # 엔트리포인트
│   ├── App.tsx              # 라우팅 + 가드
│   ├── firebase.ts          # Firebase 초기화
│   ├── stores/authStore.ts  # Zustand 인증 스토어
│   ├── services/tossAuth.ts # 토스 인증 서비스
│   ├── hooks/               # 커스텀 훅
│   ├── components/          # 공통 컴포넌트
│   ├── pages/               # 페이지
│   └── styles/              # CSS
├── AGENTS.md                # AI 개발 규칙
├── granite.config.ts        # Granite 설정
└── package.json
```

## ✏️ 커스터마이즈 체크리스트

새 앱을 만들 때 아래 항목을 변경하세요:

- [ ] `package.json` → `name` 필드
- [ ] `granite.config.ts` → `appName`, `brand.*`, `web.title`
- [ ] `.env.local` → Firebase/Convex 환경변수
- [ ] `src/services/tossAuth.ts` → `APP_KEY_PREFIXES` 변경
- [ ] `src/stores/authStore.ts` → `ONBOARDING_KEY` 변경
- [ ] `src/components/BackButtonHandler.tsx` → `EXIT_ROUTES` 설정
- [ ] `src/pages/OnboardingPage.tsx` → 앱 이름/소개 변경
- [ ] `convex/schema.ts` → 앱 고유 테이블 추가
- [ ] `index.html` → `<title>`, `<meta>` 태그 변경

## 🔒 검수 필수 패턴 (이미 적용됨)

| 항목 | 파일 | 상태 |
|------|------|------|
| 백버튼 → closeView() | `BackButtonHandler.tsx` | ✅ |
| 연동 해제 3지점 검증 | `authStore.ts` + `useTossIntegration.ts` | ✅ |
| TDS AlertDialog | `TdsAlertDialog.tsx` | ✅ |
| SDK share() | `tossAuth.ts` | ✅ |
| 세션 정리 | `tossAuth.ts` | ✅ |
| 다크 모드 | `global.css` | ✅ |
| Safe Area | `global.css` | ✅ |
| overflow-x 비활성화 | `global.css` | ✅ |
| min-width: 0 | `global.css` | ✅ |
| prefers-reduced-motion | `animations.css` | ✅ |

## 📚 참고 문서

| 자료 | 경로/URL |
|------|----------|
| 코어 문서 | `ref/01-llms-core.md` |
| 예제 코드 | `ref/02-examples.md` |
| TDS 컴포넌트 | `ref/03-tds-react-native.md` |
| 검수 체크리스트 | `ref/04-review-checklist.md` |
| 로그인 가이드 | `ref/05-login-develop.md` |
| 전략 문서 | `ref/06-obsidian-strategy.md` |
| 앱인토스 개발자센터 | https://developers-apps-in-toss.toss.im/ |
| 공식 예제 | https://github.com/toss/apps-in-toss-examples |
