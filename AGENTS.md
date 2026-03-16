# AGENTS.md — AI 개발 규칙

> 이 파일은 AI 도구(Cursor, Gemini, Copilot 등)가 앱인토스 프로젝트에서 코드를 생성할 때 반드시 따라야 하는 규칙을 정의합니다.

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| 플랫폼 | 토스 앱인토스 (Granite Framework) |
| SDK 버전 | `@apps-in-toss/web-framework` 2.0.1 |
| React | 19.x (React 19 + React DOM 19) |
| 프론트엔드 | React + TypeScript |
| 상태관리 | Zustand |
| 인증 | Firebase Auth (토스 로그인 연동) |
| 백엔드 | Convex (DB + API + Cron) |
| 빌드 CLI | `ait dev` / `ait build` / `ait deploy` |

## 2. 절대 금지 사항

- `window.alert()`, `window.confirm()` → TDS `AlertDialog` 사용
- `navigator.share()` → `@apps-in-toss/web-framework`의 `share()` 사용
- `localStorage` 직접 사용 → SDK `Storage` 우선 사용
- `popstate` 이벤트 → `graniteEvent.addEventListener('backEvent')` 사용
- 자체 백버튼/헤더/햄버거 메뉴 구현 금지
- `!isLinked` 사용 금지 → `isLinked === false` 엄격 비교
- `fetch()` 로 Convex 직접 호출 금지 → `useQuery`/`useMutation` 사용
- 별도 Python/FastAPI 서버 운영 금지
- TDS 컴포넌트(AlertDialog, Toast, BottomSheet, AlertButton)를 shadcn-ui 컴포넌트로 대체 금지

## 3. 필수 패턴

### 인증 (P0)
- 토스 로그인은 **인트로 뷰 이후** 진행
- 연동 해제 3지점 재검증: 앱 시작 + `onAuthStateChanged` + `visibilitychange`
- 연동 해제 시: `auth.signOut()` + `clearSessionForDisconnect()` + 로그인 화면 리다이렉트

### 네비게이션 (P0)
- 홈/온보딩에서 백버튼 → `closeView()`로 앱 종료
- 그 외 → `navigate(-1)`으로 뒤로 가기

### CSS (검수 필수)
- `min-width: 0` → Flex Item 기본 적용
- `overflow-x: hidden` → body에 적용
- `env(safe-area-inset-*)` → Safe Area 적용
- `@media (prefers-color-scheme: dark)` → 다크 모드 대응
- `@keyframes` → animation 사용 시 반드시 정의
- 핀치줌 비활성화 → viewport meta에 설정

### Tailwind ↔ TDS 하이브리드 규칙

| 영역 | 사용 기술 | 비고 |
|------|----------|------|
| AlertDialog, Toast, BottomSheet | **TDS 필수** | 비게임 심사에서 미사용 = 반려 |
| Button (AlertButton) | **TDS 필수** | `alertButton` prop 필수 |
| 레이아웃, 스페이싱 | Tailwind 유틸리티 | `flex`, `grid`, `p-4`, `gap-2` 등 |
| 커스텀 콘텐츠 UI | Tailwind + shadcn-ui 선별 | Card, Badge, Skeleton 등 |
| 색상 | `text-tds-*`, `bg-tds-*` | CSS 변수 → Tailwind 테마 매핑 |

### Convex 사용 패턴
- Query → `useQuery()` (읽기 전용, 실시간)
- Mutation → `useMutation()` (쓰기)
- Action → 외부 API 호출 시
- Internal → Cron Job에서만

## 4. 파일 구조

```
src/
├── main.tsx              # 엔트리포인트
├── App.tsx               # 라우팅 + 가드
├── firebase.ts           # Firebase 초기화
├── lib/                  # 유틸리티
│   ├── sdkSafety.ts      # SDK 3단계 Safety Pattern 래퍼
│   └── cn.ts             # clsx + tailwind-merge 클래스 병합
├── stores/               # Zustand 스토어
│   └── authStore.ts
├── services/             # 비즈니스 로직
│   └── tossAuth.ts
├── hooks/                # 커스텀 훅
│   ├── useAuth.ts
│   ├── useConvexAuth.ts
│   ├── useTossIntegration.ts
│   ├── useFeatureBase.ts # 표준 훅 인터페이스 (UseFeatureReturn)
│   └── useEnvironment.ts # 환경 감지 (web/toss/sandbox)
├── components/           # 공통 컴포넌트
│   ├── ui/               # shadcn-ui 스타일 (Tailwind 기반)
│   │   ├── card.tsx      # 카드 레이아웃
│   │   ├── badge.tsx     # 상태 뱃지
│   │   └── skeleton.tsx  # 로딩 플레이스홀더
│   ├── BackButtonHandler.tsx
│   ├── IntegrationGuard.tsx
│   ├── TdsAlertDialog.tsx
│   ├── LoadingScreen.tsx
│   └── ErrorBoundary.tsx
├── pages/                # 페이지 컴포넌트
│   ├── HomePage.tsx
│   ├── OnboardingPage.tsx
│   ├── TermsPage.tsx
│   └── PrivacyPage.tsx
├── styles/               # CSS
│   ├── global.css
│   ├── tds-overrides.css
│   └── animations.css
└── test/                 # 테스트
    └── setup.ts          # Vitest 테스트 환경 설정
convex/
├── auth.config.ts        # Firebase JWT 검증
├── schema.ts             # DB 스키마
└── users.ts              # 사용자 CRUD
```

## 5. 검수 체크리스트 TOP 3

1. **자체 백버튼 사용** → 공통 내비게이션 활용 필수
2. **연동 해제 콜백 미처리** → 로그아웃 + 재로그인 플로우 구현
3. **기능 스킨 404** → URL 및 종료 로직 점검

## 6. 스킬 카탈로그

> 스킬이 있는 기능은 **반드시 해당 스킬을 호출**하여 구현한다.

| Skill | 용도 | Trigger Keywords |
|-------|------|-----------------|
| `/appintoss-login` | 토스 로그인 전체 구현 (OAuth2, mTLS, JWT) | 로그인, login, 인증, auth |
| `/appintoss-rewarded-ad` | 보상형/전면형 광고 구현 | 광고, rewarded ad, interstitial |
| `/appintoss-banner-ad` | 배너 광고 v2 구현 (TossAds) | 배너, banner ad |
| `/appintoss-promotion-reward` | 토스포인트 프로모션 리워드 지급 | 리워드, 포인트, promotion, reward |
| `/appintoss-nongame-launch-checklist` | 비게임 출시 전 최종 점검 | 출시, launch, 검수, checklist |
| `/appintoss-smart-message` | 마케팅 푸시 메시지 소재 생성 | 푸시, 메시지, smart message |
| `/appintoss-tds-mobile` | TDS 디자인 시스템 가이드 (비게임 필수) | TDS, 디자인, design system |
| `/appintoss-docs` | 앱인토스 SDK 전체 레퍼런스 | SDK, API, 문서, docs |
| `/appintoss-coachmark-tutorial` | 코치마크/온보딩 튜토리얼 | 코치마크, 온보딩, tutorial |
| `/harness-workflow` | 7단계 harness 워크플로우 마스터 | 새 미니앱, 워크플로우, harness |
| `/harness-init` | 반려방지 프로젝트 초기화 | 초기화, init, 프로젝트 시작 |
| `/harness-progress` | 점진적 구현 + 세션간 상태 추적 | 진행상황, progress, 다음 기능 |
| `/harness-validate` | NEVER/ALWAYS 규칙 자동 검증 | 검증, validate, 반려 체크 |

## 7. 출시 준수 규칙 — Step 2.5 게이트 (코드 작성 전 필수)

> ⚠️ **Step 2.5**: 코드를 한 줄이라도 작성하기 **전에** 반드시 아래 체크리스트를 통과해야 한다.
> 이 게이트를 건너뛰면 심사 반려 확률이 극도로 높아진다.

### 필수 설정 체크
- [ ] `granite.config.ts`에 `navigationBar: { withBackButton: true, withHomeButton: true }` 설정
- [ ] `brand.displayName`과 `index.html` `<title>`, `<meta og:title>` 앱 이름 통일
- [ ] `<meta name="viewport">`에 `user-scalable=no` 포함

### 절대 금지 체크
- [ ] 자체 헤더/백버튼/햄버거 메뉴 구현하지 않음
- [ ] `alert()`/`confirm()` 대신 TDS AlertDialog 사용
- [ ] `navigator.share()` 대신 SDK `share()` 사용
- [ ] 앱 설치 유도 문구/배너/마켓 링크 없음

### 플로우 체크
- [ ] 로그인은 인트로 화면 이후에 진행 (앱 시작 즉시 로그인 화면 노출 금지)
- [ ] 외부 앱/브라우저 이동 없이 미니앱 내 완결

> 📋 전체 NEVER/ALWAYS 규칙: `ref/09-review-rules-claude.md` 참조
> 🔗 비게임 출시 점검: `/appintoss-nongame-launch-checklist` 스킬 호출

## 8. SDK 예제 카탈로그 (레고 블록)

> `ref/examples/apps-in-toss-examples-robin/`에 각 블록의 전체 구현 예제가 있음

### 환경 & 플랫폼

| 블록 | SDK API | 유스케이스 |
|------|---------|-----------|
| `with-env-detection` | `getOperationalEnvironment()` | 실행 환경 감지 (모든 미니앱 기본) |
| `with-platform-os` | `getPlatformOS()` | OS별 분기 처리 |
| `with-network-status` | `getNetworkStatus()` | 오프라인 대응 |
| `with-locale` | `getLocale()` | 다국어 지원 |

### 인증 & 스토리지

| 블록 | SDK API | 유스케이스 |
|------|---------|-----------|
| `with-app-login` | `appLogin()` | 사용자 인증 |
| `with-storage` | `Storage.*` | 로컬 데이터 저장 |

### 광고 & 수익화

| 블록 | SDK API | 유스케이스 |
|------|---------|-----------|
| `with-rewarded-ad` | `loadFullScreenAd()`, `showFullScreenAd()` | 광고 시청 후 보상 |
| `with-interstitial-ad` | `loadFullScreenAd()`, `showFullScreenAd()` | 화면 전환 시 광고 |
| `with-banner-ad` | `TossAds.initialize()`, `TossAds.attachBanner()` | 상시 노출 배너 |
| `with-in-app-purchase` | `getProductItemList()`, `createOneTimePurchaseOrder()` | 유료 아이템 판매 |

### 바이럴 & 공유

| 블록 | SDK API | 유스케이스 |
|------|---------|-----------|
| `with-share-reward` | `contactsViral()` | 친구 초대 리워드 |
| `with-contacts-viral` | `contactsViral()` | 대량 초대 캠페인 |
| `with-share-link` | `getTossShareLink()` | 콘텐츠 공유 |
| `with-clipboard-text` | `setClipboardText()`, `getClipboardText()` | 텍스트 복사/붙여넣기 |

### 미디어 & 디바이스

| 블록 | SDK API | 유스케이스 |
|------|---------|-----------|
| `with-camera` | `openCamera()` | 사진 촬영 |
| `with-album-photos` | `fetchAlbumPhotos()` | 갤러리 접근 |
| `with-location-once` | `getCurrentLocation()` | 현재 위치 확인 |
| `with-location-tracking` | `startUpdateLocation()` | 실시간 위치 트래킹 |
| `with-haptic-feedback` | `generateHapticFeedback()` | 터치 피드백 |

### UI & 네비게이션

| 블록 | SDK API | 유스케이스 |
|------|---------|-----------|
| `with-navigation-bar` | `partner.addAccessoryButton()` | 상단바 버튼 추가 |
| `with-back-event` | `useBackEvent()` | 뒤로가기 인터셉트 |
| `with-permission` | `getPermission()`, `openPermissionDialog()` | 카메라/위치 권한 |
| `with-push-notification` | Server-side REST API | 마케팅/알림 푸시 |

### 풀스택 시나리오 (비즈니스 패턴)

| 시나리오 | 조합 블록 |
|----------|----------|
| `scenario-attendance-reward` | login + storage + rewarded-ad + promotion |
| `scenario-lottery-reward` | rewarded-ad + promotion |
| `scenario-mission-system` | storage + promotion |
| `scenario-share-viral` | contacts-viral + storage |
| `scenario-milestone-withdraw` | storage + promotion |
| `scenario-onboarding-coach` | storage + env-detection |

## 9. 미니앱 레시피 (조합 가이드)

| 앱 유형 | 필요 블록 | 참고 |
|---------|----------|------|
| 출석체크 | login + storage + rewarded-ad + promotion + calendar UI | `scenario-attendance-reward` |
| 바이럴 리워드 | login + share-reward + contacts-viral + promotion | `scenario-share-viral` |
| 콘텐츠/미디어 | login + camera + album-photos + storage + share-link | - |
| 게임 | env-detection + rewarded-ad + in-app-purchase + haptic | TDS 선택 |
| 커머스 | login + in-app-purchase + push-notification + storage | TDS 필수 |
| 미션/이벤트 | login + storage + promotion + rewarded-ad + push | `scenario-mission-system` |

## 10. SDK Import 규칙 & Safety Pattern (필수)

### Import 규칙

```typescript
// ✅ CORRECT: Dynamic import + isSupported
const { loadFullScreenAd } = await import('@apps-in-toss/web-framework');
if (loadFullScreenAd.isSupported() !== true) { /* mock */ return; }

// ❌ WRONG: Static import (번들 크기 증가 + 웹 환경 크래시)
import { loadFullScreenAd } from '@apps-in-toss/web-framework';
```

### Safety Pattern (3단계)

모든 SDK API 호출은 반드시 이 패턴을 따른다:

```typescript
// Step 1: Dynamic import (번들 최적화)
const { someAPI } = await import('@apps-in-toss/web-framework');

// Step 2: isSupported 체크 (웹 환경 graceful degradation)
if (someAPI.isSupported() !== true) {
  // mock 동작 제공
  return;
}

// Step 3: cleanup 패턴 (메모리 누수 방지)
const cleanup = someAPI({ onEvent, onError });
return () => cleanup?.();
```

## 11. Environment Detection (환경 구분)

```typescript
const env = getOperationalEnvironment(); // 'web' | 'toss' | 'sandbox'
// web: 브라우저 개발 → mock 데이터, console.log
// sandbox: 토스 테스트 환경 → 테스트 광고 ID
// toss: 프로덕션 → 실제 SDK API
```

## 12. Standard Hook Interface (표준 훅 인터페이스)

모든 SDK 기능 훅은 아래 인터페이스를 따른다:

```typescript
interface UseFeatureReturn {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: Error | null;
  isSupported: boolean;
  environment: 'web' | 'toss' | 'sandbox';
}
```

## 13. Naming Conventions (네이밍 규칙)

| 대상 | 패턴 | 예시 |
|------|------|------|
| Hook | `use{Feature}.ts` | `useRewardedAd.ts` |
| Component | `{Feature}Demo.tsx` | `RewardedAdDemo.tsx` |
| Store | `{feature}Store.ts` | `rewardedAdStore.ts` |
| Page | `{Feature}.tsx` | `Home.tsx` |
| Directory | `with-{feature}` / `scenario-{name}` | `with-rewarded-ad` |

## 14. 참고 문서

| 문서 | URL |
|------|-----|
| SDK Overview (LLM) | https://developers-apps-in-toss.toss.im/llms.txt |
| SDK Full Docs (LLM) | https://developers-apps-in-toss.toss.im/llms-full.txt |
| 앱인토스 개발자 센터 | https://developers-apps-in-toss.toss.im |
| 광고 (Ads) | https://developers-apps-in-toss.toss.im/ads/develop.html |
| 프로모션 (Promotion) | https://developers-apps-in-toss.toss.im/promotion/develop.html |
| 로그인 (Login) | https://developers-apps-in-toss.toss.im/login/develop.html |
| 공유리워드 (Share) | https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/contactsViral.html |
| 인앱결제 (IAP) | https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱결제/IAP.html |
| 권한 (Permission) | https://developers-apps-in-toss.toss.im/bedrock/reference/framework/권한/permission.html |
| 뒤로가기 (Back) | https://developers-apps-in-toss.toss.im/bedrock/reference/framework/이벤트제어/back-event.html |
| 네비게이션바 (NavBar) | https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/NavigationBar.html |
| TDS React Native | https://tossmini-docs.toss.im/tds-react-native |
| TDS Mobile (Web) | https://tossmini-docs.toss.im/tds-mobile |
